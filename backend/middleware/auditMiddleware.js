import { createLog } from '../controllers/auditLogController.js';

export const auditMiddleware = (req, res, next) => {
  // Solo registrar métodos que modifican datos
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    // Esperar a que la respuesta termine para asegurar que fue exitosa
    res.on('finish', () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const userId = req.user ? req.user.id : null;
        const username = req.user ? req.user.username : 'Sistema/Anónimo';
        
        // No registrar login por seguridad de datos
        if (req.url.includes('/auth/login')) return;
        
        const action = req.method; // POST, PUT, DELETE, PATCH
        
        // Intentar extraer el recurso del URL (ej: /api/employees -> employees)
        const urlParts = req.url.split('/');
        const target = urlParts[2] || 'unknown';
        
        // Intentar extraer ID si existe (ej: /api/employees/5 -> 5)
        const targetId = urlParts[3] || null;
        
        let details = '';
        if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
          // Clonar el body y eliminar campos sensibles
          const body = { ...req.body };
          delete body.password;
          details = JSON.stringify(body);
        } else if (req.method === 'DELETE') {
          details = `Eliminado recurso con ID: ${targetId}`;
        }
        
        // Llamar a la función del controlador para guardar en la BD
        createLog(userId, username, action, target, targetId, details);
      }
    });
  }
  next();
};
