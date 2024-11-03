export default async function handler(req, res) {
    const { method } = req;

    switch (method) {
        case 'POST':
            // Lógica para manejar el registro de usuario
            // Llama a authController.register(req, res);
            break;
        case 'GET':
            // Lógica para manejar el inicio de sesión de usuario
            // Llama a authController.login(req, res);
            break;
        default:
            res.setHeader('Allow', ['POST', 'GET']);
            res.status(405).end(`Method ${method} Not Allowed`);
    }
}