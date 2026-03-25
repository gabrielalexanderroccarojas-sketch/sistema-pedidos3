const express = require('express');
const fs = require('fs');
const https = require('https');

const app = express();
app.use(express.json());
app.use(express.static('.'));

const PEDIDOS_FILE = 'pedidos.json';

// ========== CONFIGURACIÓN TELEGRAM ==========
const TELEGRAM_TOKEN = '8726821212:AAETB8PwQeDif3-YySlZZ4fTFWZjyByWd-A';
const TELEGRAM_CHAT_ID = '6812811774';

function guardarPedido(pedido) {
    let pedidos = [];
    if (fs.existsSync(PEDIDOS_FILE)) {
        pedidos = JSON.parse(fs.readFileSync(PEDIDOS_FILE));
    }
    pedido.id = Date.now();
    pedido.fecha = new Date().toLocaleString();
    pedidos.unshift(pedido);
    fs.writeFileSync(PEDIDOS_FILE, JSON.stringify(pedidos, null, 2));
    
    console.log('📦 Pedido guardado ID:', pedido.id);
    enviarNotificacion(pedido);
}

function enviarNotificacion(pedido) {
    let productosTexto = '';
    pedido.productos.forEach(p => {
        productosTexto += `• ${p.cantidad}x ${p.nombre} - $${p.subtotal}\n`;
    });
    
    const mensaje = `🔔 *NUEVO PEDIDO* 🔔\n\n📦 *Productos:*\n${productosTexto}\n💰 *Total:* $${pedido.total}\n🕐 *Hora:* ${pedido.fecha}\n\n✅ Revisa el panel admin`;
    
    const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage?chat_id=${TELEGRAM_CHAT_ID}&text=${encodeURIComponent(mensaje)}&parse_mode=Markdown`;
    
    https.get(url, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            try {
                const result = JSON.parse(data);
                if (result.ok) {
                    console.log('✅ Notificación enviada a Telegram');
                } else {
                    console.log('❌ Error Telegram:', result.description);
                }
            } catch(e) {
                console.log('❌ Error al parsear respuesta');
            }
        });
    }).on('error', (err) => {
        console.log('❌ Error de conexión:', err.message);
    });
}

app.post('/api/pedido', (req, res) => {
    console.log('📨 Pedido recibido');
    const pedido = req.body;
    guardarPedido(pedido);
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

const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Servidor corriendo en puerto ${PORT}`);
    console.log(`📱 Notificaciones a Telegram activadas`);
    console.log(`🤖 Bot de Telegram configurado`);
});
