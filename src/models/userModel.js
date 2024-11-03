class User {
    constructor(id, username, password, email) {
        this.id = id;
        this.username = username;
        this.password = password;
        this.email = email;
    }

    static async createUser(db, username, password, email) {
        const result = await db.query(
            'INSERT INTO users (username, password, email) VALUES ($1, $2, $3) RETURNING *',
            [username, password, email]
        );
        return new User(result.rows[0].id, result.rows[0].username, result.rows[0].password, result.rows[0].email);
    }

    static async findUserById(db, id) {
        const result = await db.query('SELECT * FROM users WHERE id = $1', [id]);
        if (result.rows.length) {
            const user = result.rows[0];
            return new User(user.id, user.username, user.password, user.email);
        }
        return null;
    }

    static async findUserByUsername(db, username) {
        const result = await db.query('SELECT * FROM users WHERE username = $1', [username]);
        if (result.rows.length) {
            const user = result.rows[0];
            return new User(user.id, user.username, user.password, user.email);
        }
        return null;
    }
}

export default User;