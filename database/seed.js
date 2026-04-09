const db = require('../src/config/db');

// mapping tabel ke file JSON
const seedConfig = [
  {
    table: 'merchandise',
    file: './data/merchandise.json',
    columns: ['name', 'description', 'price', 'sizes', 'shopee_url', 'image_url']
  },
  {
    table: 'news',
    file: './data/news.json',
    columns: ['title', 'content', 'image_url']
  }
];

db.serialize(() => {
  seedConfig.forEach((config) => {
    const data = require(config.file);

    db.get(`SELECT COUNT(*) as count FROM ${config.table}`, [], (err, row) => {
      if (err) return console.error(err.message);

      if (row.count > 0) {
        console.log(`${config.table} sudah ada, skip.`);
        return;
      }

      const placeholders = config.columns.map(() => '?').join(', ');
      const columnNames = config.columns.join(', ');

      const stmt = db.prepare(`
        INSERT INTO ${config.table} (${columnNames})
        VALUES (${placeholders})
      `);

      data.forEach((item) => {
        const values = config.columns.map(col => item[col]);
        stmt.run(values);
      });

      stmt.finalize();
      console.log(`Seeder ${config.table} selesai.`);
    });
  });
});