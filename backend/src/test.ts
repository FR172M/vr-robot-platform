import { query } from './db';

async function testDB() {
    const res = await query('SELECT NOW()'); // await hier nötig!
    console.log('Database time:', res.rows[0]); // .rows funktioniert jetzt!
}

testDB().catch((err) => {
    console.error('Error testing DB:', err);
});
