import React, { useState } from 'react';
import { Terminal, Copy, Check, Server, Database, Sparkles, Clock, ShieldCheck, ExternalLink, Code } from 'lucide-react';

export const GcpDeploymentGuide: React.FC = () => {
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(id);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const steps = [
    {
      id: 'step-1',
      time: 'Min 00 - 05',
      title: '1. Configure GCP Project & Enable APIs',
      desc: 'Set active project to "totemic-formula-509809-a9" and activate Cloud Run, Cloud SQL, Secret Manager, and Vertex/Gemini APIs.',
      code: `# 1. Set your GCP project
gcloud config set project "totemic-formula-509809-a9"

# 2. Enable necessary Google Cloud services
gcloud services enable \\
  run.googleapis.com \\
  sqladmin.googleapis.com \\
  secretmanager.googleapis.com \\
  aiplatform.googleapis.com \\
  cloudbuild.googleapis.com

# 3. Verify active credentials & project
gcloud auth list
gcloud config list project`,
    },
    {
      id: 'step-2',
      time: 'Min 05 - 12',
      title: '2. Provision Cloud SQL (PostgreSQL) Database',
      desc: 'Create a lightweight PostgreSQL instance with automated scale-to-zero capabilities and initialize the SubSense schema.',
      code: `# 1. Create a Cloud SQL PostgreSQL instance (Single zone for quick MVP dev)
gcloud sql instances create subsense-db \\
  --database-version=POSTGRES_15 \\
  --tier=db-f1-micro \\
  --region=asia-east1 \\
  --root-password="StrongSubSensePassword123!"

# 2. Create the application database
gcloud sql databases create subsensedb --instance=subsense-db

# 3. Create application user
gcloud sql users create subsense_user \\
  --instance=subsense-db \\
  --password="UserSecurePassword456!"

# 4. Connect via Cloud Shell or Cloud SQL Proxy to run DDL schema:
gcloud sql connect subsense-db --user=subsense_user --database=subsensedb`,
      sqlSnippet: `-- Run inside Cloud SQL PostgreSQL (subsensedb):
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) REFERENCES users(id),
  name VARCHAR(120) NOT NULL,
  category VARCHAR(60) NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'INR',
  billing_cycle VARCHAR(20) DEFAULT 'MONTHLY',
  renewal_day INT DEFAULT 1,
  start_date DATE,
  status VARCHAR(30) DEFAULT 'ACTIVE',
  usage_frequency VARCHAR(20) DEFAULT 'moderate',
  last_used_date DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS subscription_usage (
  id VARCHAR(64) PRIMARY KEY,
  subscription_id VARCHAR(64) REFERENCES subscriptions(id) ON DELETE CASCADE,
  used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  usage_type VARCHAR(50),
  duration_minutes INT DEFAULT 0
);

CREATE INDEX idx_sub_user ON subscriptions(user_id);
CREATE INDEX idx_sub_status ON subscriptions(status);`,
    },
    {
      id: 'step-3',
      time: 'Min 12 - 17',
      title: '3. Store Gemini API Key in Secret Manager',
      desc: 'Never hardcode API keys in code or containers. Store securely in Google Secret Manager.',
      code: `# 1. Create secret for Gemini API
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"

# 2. Store your Gemini API key (from Google AI Studio)
echo -n "YOUR_GEMINI_API_KEY_HERE" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# 3. Store Database Password
echo -n "UserSecurePassword456!" | gcloud secrets create DB_PASSWORD --replication-policy="automatic" --data-file=-`,
    },
    {
      id: 'step-4',
      time: 'Min 17 - 24',
      title: '4. Cloud Run Backend Service (Spring Boot / Node)',
      desc: 'Build the application that connects to Cloud SQL via unix domain socket and calls Gemini API for natural language extraction and waste analysis.',
      code: `# application.properties (for Spring Boot):
spring.datasource.url=jdbc:postgresql:////cloudsql/totemic-formula-509809-a9:asia-east1:subsense-db/subsensedb
spring.datasource.username=subsense_user
spring.datasource.password=\${DB_PASSWORD}
spring.datasource.driver-class-name=org.postgresql.Driver

# Gemini API configuration:
gemini.api.key=\${GEMINI_API_KEY}
gemini.api.model=gemini-2.5-flash`,
      sampleCode: `// Sample Java Spring Boot Controller calling Gemini & Cloud SQL
@RestController
@RequestMapping("/api")
public class SubscriptionIntelligenceController {

    @Autowired
    private SubscriptionRepository subRepo;

    @Autowired
    private GeminiIntelligenceService geminiService;

    @PostMapping("/extract-subscription")
    public ResponseEntity<SubscriptionDTO> extract(@RequestBody ExtractionRequest req) {
        // Calls Gemini 2.5 Flash with structured schema
        SubscriptionDTO extracted = geminiService.extractFromUnstructured(req.getText());
        return ResponseEntity.ok(extracted);
    }

    @PostMapping("/analyze-waste")
    public ResponseEntity<WasteAnalysisDTO> analyze(@RequestBody List<Subscription> subs) {
        // 1. Run deterministic rules (inactivity > 30d, high cost + rare usage)
        List<Subscription> flagged = WasteRulesEngine.evaluate(subs);
        // 2. Call Gemini for executive summary & savings explanation
        WasteAnalysisDTO report = geminiService.generateWasteBriefing(flagged);
        return ResponseEntity.ok(report);
    }
}`,
    },
    {
      id: 'step-5',
      time: 'Min 24 - 30',
      title: '5. Build & Deploy Container to Cloud Run',
      desc: 'Deploy the containerized service to Google Cloud Run, linking the Cloud SQL instance connection.',
      code: `# 1. Build and push container image using Cloud Build
gcloud builds submit --tag gcr.io/totemic-formula-509809-a9/subsense-app:v1

# 2. Deploy to Cloud Run with Cloud SQL connection & Secret Manager bindings
gcloud run deploy subsense-service \\
  --image gcr.io/totemic-formula-509809-a9/subsense-app:v1 \\
  --platform managed \\
  --region asia-east1 \\
  --allow-unauthenticated \\
  --add-cloudsql-instances totemic-formula-509809-a9:asia-east1:subsense-db \\
  --set-env-vars DB_NAME=subsensedb,DB_USER=subsense_user \\
  --set-secrets GEMINI_API_KEY=GEMINI_API_KEY:latest,DB_PASSWORD=DB_PASSWORD:latest

# 3. Retrieve your public HTTPS production URL
gcloud run services describe subsense-service --region asia-east1 --format='value(status.url)'`,
    },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-950/60 via-slate-900 to-indigo-950/60 border border-emerald-500/30 rounded-2xl p-6 sm:p-8 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                30-Minute Rapid GCP Architecture
              </span>
              <span className="text-xs text-slate-400">Target Project: <b>totemic-formula-509809-a9</b></span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Production Architecture Blueprint
            </h1>
            <p className="text-sm text-slate-300 mt-2 max-w-2xl leading-relaxed">
              Strictly architected around your 3 core Google Cloud components:
              <br />
              <b className="text-purple-400">Gemini API</b> (Understands unstructured user input) •{' '}
              <b className="text-indigo-400">Cloud Run</b> (Spring Boot / Node REST intelligence) •{' '}
              <b className="text-emerald-400">Cloud SQL</b> (PostgreSQL stores financial/usage history).
            </p>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl shrink-0 text-xs space-y-1.5">
            <div className="text-slate-400 font-semibold uppercase text-[10px]">Resource Allocation</div>
            <div className="flex items-center gap-2 text-slate-200">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>Gemini 2.5 Flash API</span>
            </div>
            <div className="flex items-center gap-2 text-slate-200">
              <Server className="w-3.5 h-3.5 text-indigo-400" />
              <span>Cloud Run (Serverless)</span>
            </div>
            <div className="flex items-center gap-2 text-slate-200">
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span>Cloud SQL PostgreSQL (db-f1-micro)</span>
            </div>
          </div>
        </div>

        {/* Visual Architecture Diagram */}
        <div className="mt-6 pt-6 border-t border-slate-800/80">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
            System Data Flow:
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-center text-xs">
            <div className="bg-slate-900/80 border border-slate-700/80 p-3 rounded-xl">
              <div className="font-bold text-white mb-1">User Client</div>
              <p className="text-slate-400 text-[11px]">Web Interface / Mobile</p>
              <div className="text-indigo-400 text-[10px] mt-2">Natural text &amp; dashboard</div>
            </div>
            <div className="bg-indigo-950/50 border border-indigo-500/40 p-3 rounded-xl">
              <div className="font-bold text-indigo-300 mb-1">Cloud Run Service</div>
              <p className="text-slate-300 text-[11px]">Spring Boot / Node Engine</p>
              <div className="text-indigo-300 text-[10px] mt-2">REST APIs &amp; Waste Rules</div>
            </div>
            <div className="bg-emerald-950/50 border border-emerald-500/40 p-3 rounded-xl">
              <div className="font-bold text-emerald-300 mb-1">Cloud SQL</div>
              <p className="text-slate-300 text-[11px]">PostgreSQL Instance</p>
              <div className="text-emerald-300 text-[10px] mt-2">Subscriptions &amp; Usage Logs</div>
            </div>
            <div className="bg-purple-950/50 border border-purple-500/40 p-3 rounded-xl">
              <div className="font-bold text-purple-300 mb-1">Gemini API</div>
              <p className="text-slate-300 text-[11px]">Google GenAI SDK</p>
              <div className="text-purple-300 text-[10px] mt-2">Extract NLP &amp; Explain Waste</div>
            </div>
          </div>
        </div>
      </div>

      {/* Step by Step Timeline */}
      <div className="space-y-6">
        {steps.map((step) => (
          <div
            key={step.id}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4 hover:border-slate-700 transition-colors"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 mr-2">
                  {step.time}
                </span>
                <h3 className="text-base font-bold text-white inline-block mt-1 sm:mt-0">
                  {step.title}
                </h3>
                <p className="text-xs text-slate-400 mt-1">{step.desc}</p>
              </div>

              <button
                onClick={() => copyCode(step.code, step.id)}
                className="self-start sm:self-auto bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-3 py-1.5 rounded-lg border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedIndex === step.id ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Commands</span>
                  </>
                )}
              </button>
            </div>

            {/* Code Block */}
            <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 font-mono text-xs text-slate-200 overflow-x-auto whitespace-pre leading-relaxed">
              {step.code}
            </div>

            {/* Optional SQL / Java snippet */}
            {step.sqlSnippet && (
              <div className="space-y-2 mt-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5" />
                    Complete PostgreSQL Schema DDL
                  </span>
                  <button
                    onClick={() => copyCode(step.sqlSnippet!, `${step.id}-sql`)}
                    className="text-slate-400 hover:text-white text-xs flex items-center gap-1 cursor-pointer"
                  >
                    {copiedIndex === `${step.id}-sql` ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    <span>Copy SQL</span>
                  </button>
                </div>
                <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 font-mono text-xs text-emerald-300/90 overflow-x-auto whitespace-pre leading-relaxed">
                  {step.sqlSnippet}
                </div>
              </div>
            )}

            {step.sampleCode && (
              <div className="space-y-2 mt-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-indigo-400 flex items-center gap-1.5">
                    <Code className="w-3.5 h-3.5" />
                    Backend Controller &amp; Waste Rule Logic
                  </span>
                  <button
                    onClick={() => copyCode(step.sampleCode!, `${step.id}-java`)}
                    className="text-slate-400 hover:text-white text-xs flex items-center gap-1 cursor-pointer"
                  >
                    {copiedIndex === `${step.id}-java` ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    <span>Copy Code</span>
                  </button>
                </div>
                <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 font-mono text-xs text-indigo-300/90 overflow-x-auto whitespace-pre leading-relaxed">
                  {step.sampleCode}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
