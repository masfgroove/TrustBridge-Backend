const mongoose = require('mongoose');
const crypto = require('crypto');
require('dotenv').config();

// Copie a URI do seu .env ou cole aqui
const uri = process.env.MONGODB_URI; 

const ComplianceSchema = new mongoose.Schema({
    companyName: String,
    documentType: String,
    commodity: String,
    representative: String,
    status: String,
    blockchainHash: String,
    complianceScore: Number,
    data: { type: Date, default: Date.now }
}, { collection: 'modelos' });

const Compliance = mongoose.model('Compliance', ComplianceSchema);

const gerarHash = (nome) => `0x${crypto.createHash('sha256').update(nome + Date.now()).digest('hex').substring(0, 32).toUpperCase()}`;

const dadosFake = [
    { name: "Alpha Global Trading", type: "LOI", item: "Sugar ICUMSA 45", rep: "John Smith" },
    { name: "Bravo Export Ltda", type: "ICPO", item: "Soybeans (Non-GMO)", rep: "Carlos Silva" },
    { name: "China State Energy", type: "SCO", item: "Iron Ore", rep: "Li Wei" },
    { name: "Dubai Gold Refinery", type: "SPA", item: "Gold Bullion", rep: "Ahmed Bin" },
    { name: "Euro Commodities SA", type: "LOI", item: "Corn (Yellow)", rep: "Hans Müller" },
    { name: "Oceanic Logistics", type: "BL", item: "Crude Oil", rep: "Sarah Jones" },
    { name: "Andes Mining Group", type: "ICPO", item: "Copper Cathodes", rep: "Diego Ramos" },
    { name: "Nordic Fish Corp", type: "SCO", item: "Frozen Salmon", rep: "Erik Larson" },
    { name: "Texas Cattle Co", type: "LOI", item: "Frozen Beef", rep: "James Root" },
    { name: "Singapore AgriHub", type: "SPA", item: "Palm Oil", rep: "Tan Min" },
    { name: "Moscovo Export", type: "ICPO", item: "Wheat", rep: "Ivan Petov" },
    { name: "Japan Tech Imports", type: "LOI", item: "Rare Earth Metals", rep: "Kenji Sato" },
    { name: "Canada Lumber Ltd", type: "SCO", item: "Softwood Timber", rep: "Robert Dow" },
    { name: "Sydney Grain Co", type: "SPA", item: "Barley", rep: "Bruce Wayne" },
    { name: "Vietnam Rice Exporters", type: "ICPO", item: "Jasmine Rice", rep: "Nguyen Van" },
    { name: "India Spices Group", type: "LOI", item: "Black Pepper", rep: "Rajesh Kooth" },
    { name: "Swiss Trust Assets", type: "SPA", item: "Investment Token", rep: "Marc Buffet" },
    { name: "South Africa Ores", type: "ICPO", item: "Manganese", rep: "Luka Modric" },
    { name: "Green Coffee Brazil", type: "LOI", item: "Arabica Coffee", rep: "Felipe Neto" },
    { name: "Qatar Gas Portal", type: "SPA", item: "LNG Gas", rep: "Abdul Aziz" }
];

async function seedDB() {
    try {
        await mongoose.connect(uri);
        console.log("Conectado para injetar dados...");

        // Opcional: Limpar o banco antes (Cuidado! Comente se quiser manter o que já tem)
        // await Compliance.deleteMany({}); 

        const documentosFinal = dadosFake.map(d => ({
            companyName: d.name,
            documentType: d.type,
            commodity: d.item,
            representative: d.rep,
            status: "UNDER REVIEW",
            blockchainHash: gerarHash(d.name),
            complianceScore: Math.floor(Math.random() * (60 - 20 + 1)) + 20 // Score entre 20 e 60
        }));

        await Compliance.insertMany(documentosFinal);
        console.log("✅ 20 Registros de Elite inseridos no MongoDB!");
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

seedDB();