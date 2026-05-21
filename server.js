const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const crypto = require('crypto'); // Adicionado: faltava esta importação
require('dotenv').config();

const app = express();

// Middleware de CORS
app.use((req, res, next) => {
    // Permite que sua Vercel acesse a API
    res.setHeader('Access-Control-Allow-Origin', 'https://trust-bridge-frontend.vercel.app');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    // Resposta automática para o "pré-flight" do navegador
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

app.use(express.json());

// Conexão com o MongoDB Atlas
const uri = process.env.MONGODB_URI;

mongoose.connect(uri)
    .then(() => console.log("🚀 TRUSTBRIDGE: Protocolo de Segurança Ativo!"))
    .catch(err => console.error("❌ Falha na conexão:", err.message));

// --- SCHEMAS ---
const ComplianceSchema = new mongoose.Schema({
    companyName: { type: String, required: true },
    documentType: { type: String, required: true },
    commodity: { type: String, required: true },
    representative: { type: String, required: true },
    status: { type: String, default: "UNDER REVIEW" },
    blockchainHash: { type: String }, 
    complianceScore: { type: Number, default: 25 },
    auditLog: [{ 
        action: String, 
        timestamp: { type: Date, default: Date.now } 
    }],
    data: { type: Date, default: Date.now }
}, { collection: 'modelos' });

const ComplianceModel = mongoose.model('Compliance', ComplianceSchema);

const LogSchema = new mongoose.Schema({
    documentId: String,
    companyName: String,
    action: String, 
    auditorWallet: String, 
    timestamp: { type: Date, default: Date.now },
    details: String
}, { collection: 'audit_logs' });

const LogModel = mongoose.model('Log', LogSchema);

// --- ROTAS DA API ---
app.get('/', (req, res) => {
    res.send("🚀 TRUSTBRIDGE GATEWAY: Ativo");
});

app.get('/api/modelos', async (req, res) => {
    try {
        const registros = await ComplianceModel.find().sort({ data: -1 });
        res.status(200).json(registros);
    } catch (error) {
        res.status(500).json({ error: "Erro no banco de dados." });
    }
});

app.post('/api/inscrever', async (req, res) => {
    try {
        const { companyName, commodity } = req.body;
        const seed = `${companyName}-${commodity}-${Date.now()}`;
        const hash = crypto.createHash('sha256').update(seed).digest('hex');

        const novaSubmissao = new ComplianceModel({
            ...req.body,
            blockchainHash: `0x${hash.toUpperCase()}`,
            complianceScore: 35,
            auditLog: [{ action: "Document Received & Hash Generated" }]
        });

        await novaSubmissao.save();
        res.status(201).json({ message: "Data Secured!", hash: `0x${hash.substring(0, 16)}...` });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.put('/api/modelos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        let updates = req.body;

        delete updates._id;
        delete updates.__v;
        delete updates.auditLog;

        if(updates.status === "APPROVED") {
            updates.complianceScore = 100;
        }

        const doc = await ComplianceModel.findByIdAndUpdate(
            id, 
            { 
                $set: updates, 
                $push: { auditLog: { action: `Manual Update: ${updates.status || 'Data Changed'}` } } 
            }, 
            { new: true, runValidators: true }
        );

        if (!doc) return res.status(404).json({ error: "Documento não encontrado." });
        
        res.status(200).json(doc);
    } catch (error) {
        res.status(500).json({ error: "Erro na auditoria.", details: error.message });
    }
});

app.delete('/api/modelos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const docDeletado = await ComplianceModel.findByIdAndDelete(id);

        if (!docDeletado) return res.status(404).json({ error: "Documento não encontrado." });
        
        res.status(200).json({ message: "Asset permanently deleted." });
    } catch (error) {
        res.status(500).json({ error: "Erro ao deletar.", details: error.message });
    }
});

app.post('/api/logs', async (req, res) => {
    try {
        const newLog = new LogModel(req.body);
        await newLog.save();
        res.status(201).json({ success: true });
    } catch (error) {
        res.status(500).json({ error: "Failed to save audit log" });
    }
});

// --- PORTA DINÂMICA PARA O RENDER ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n============================================`);
    console.log(`✅ TrustBridge Backend v3 rodando na porta ${PORT}`);
    console.log(`============================================\n`);
});