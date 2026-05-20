const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const crypto = require('crypto');
require('dotenv').config();

const app = express();

// Configurações principais
app.use(express.json());
app.use(cors());

// Conexão com o MongoDB Atlas
const uri = process.env.MONGODB_URI;

mongoose.connect(uri)
    .then(() => console.log("🚀 TRUSTBRIDGE: Protocolo de Segurança Ativo!"))
    .catch(err => console.error("❌ Falha na conexão:", err.message));

// --- 1. SCHEMA DE COMPLIANCE ---
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

// --- 2. SCHEMA DE LOGS ---
const LogSchema = new mongoose.Schema({
    documentId: String,
    companyName: String,
    action: String, 
    auditorWallet: String, 
    timestamp: { type: Date, default: Date.now },
    details: String
}, { collection: 'audit_logs' });

const LogModel = mongoose.model('Log', LogSchema);

// --- 3. ROTAS DA API ---

app.get('/', (req, res) => {
    res.send("🚀 TRUSTBRIDGE GATEWAY: Ativo");
});

// Listar Ativos
app.get('/api/modelos', async (req, res) => {
    try {
        const registros = await ComplianceModel.find().sort({ data: -1 });
        res.status(200).json(registros);
    } catch (error) {
        res.status(500).json({ error: "Erro no banco de dados." });
    }
});

// Criar Novo Ativo
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

// 🔥 ROTA DE ATUALIZAÇÃO (VERSÃO ÚNICA E CORRIGIDA)
app.put('/api/modelos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        let updates = req.body;

        // 1. Limpeza Crítica para evitar conflitos no MongoDB
        delete updates._id;
        delete updates.__v;
        delete updates.auditLog; // Fundamental para não dar erro de conflito de path

        // 2. Regra de negócio: Se aprovar, score vai para 100
        if(updates.status === "APPROVED") {
            updates.complianceScore = 100;
        }

        // 3. Update com $set e $push separados
        const doc = await ComplianceModel.findByIdAndUpdate(
            id, 
            { 
                $set: updates, 
                $push: { auditLog: { action: `Manual Update: ${updates.status || 'Data Changed'}` } } 
            }, 
            { new: true, runValidators: true }
        );

        if (!doc) return res.status(404).json({ error: "Documento não encontrado." });
        
        console.log(`✅ SUCESSO: Documento ${id} atualizado com sucesso!`);
        res.status(200).json(doc);
    } catch (error) {
        console.error("❌ ERRO NO UPDATE:", error.message);
        res.status(500).json({ error: "Erro na auditoria.", details: error.message });
    }
});

// 🔥 ROTA DE DELEÇÃO (ADICIONADA PARA FAZER O REJECT FUNCIONAR)
app.delete('/api/modelos/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const docDeletado = await ComplianceModel.findByIdAndDelete(id);

        if (!docDeletado) {
            return res.status(404).json({ error: "Documento não encontrado no banco de dados." });
        }

        console.log(`🗑️ REGISTRO REMOVIDO: Documento ${id} foi excluído com sucesso.`);
        res.status(200).json({ message: "Asset permanently deleted from database." });
    } catch (error) {
        console.error("❌ ERRO AO DELETAR:", error.message);
        res.status(500).json({ error: "Erro interno ao tentar deletar o registro.", details: error.message });
    }
});

// Rota de Logs
app.post('/api/logs', async (req, res) => {
    try {
        const newLog = new LogModel(req.body);
        await newLog.save();
        res.status(201).json({ success: true });
    } catch (error) {
        res.status(500).json({ error: "Failed to save audit log" });
    }
});

// Porta
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`\n============================================`);
    console.log(`✅ TrustBridge Backend v3 rodando na porta ${PORT}`);
    console.log(`🛡️  Audit Trail & Rota de Exclusão Ativadas`);
    console.log(`============================================\n`);
});