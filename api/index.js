const express = require('express');
const fs = require('fs');
const https = require('https');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '..')));

const PEDIDOS_FILE = path.join(__dirname, '..', 'pedidos.json');

const TELEGRAM_TOKEN = '8726821212:AAETB8PwQeDif3-YySlZZ4fTFWZjyByWd-A';
const TELEGRAM_CHAT_ID = '6812811774';

function enviarNotificacion(pedido) {
    let productosTexto = '';
    pedido.productos.forEach(p => {
        productosTexto += `• ${p.cantidad}x ${p.nombre} - $${p.subtotal}\n`;
    });
    
    const mensaje = `🔔 *NUEVO PEDIDO* 🔔\n\n📦 *Productos:*\n${productosTexto}\n💰 *Total:* $${pedido.total}\n🕐 *Hora:* ${pedido.fecha}\n\n✅ Revisa el panel admin`;
    
    const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage?chat_id=${TELEGRAM_CHAT_ID}&text=${encodeURIComponent(mensaje)}&parse_mode=Markdown`;
    
    https.get(url, () => {});
}

app.post('/api/pedido', (req, res) => {
    const pedido = req.body;
    pedido.id = Date.now();
    pedido.fecha = new Date().toLocaleString();
    
    let pedidos = [];
    if (fs.existsSync(PEDIDOS_FILE)) {
        pedidos = JSON.parse(fs.readFileSync(PEDIDOS_FILE));
    }
    pedidos.unshift(pedido);
    fs.writeFileSync(PEDIDOS_FILE, JSON.stringify(pedidos, null, 2));
    
    enviarNotificacion(pedido);
    res.json({ success: true, id: pedido.id });
});

app.get('/api/pedidos', (req, res) => {
    if (fs.existsSync(PEDIDOS_FILE)) {
        const pedidos = JSON.parse(fs.readFileSync(PEDIDOS_FILE));
        res.json(pedidos);
    } else {
        res.json([]);
    }
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

module.exports = app;
