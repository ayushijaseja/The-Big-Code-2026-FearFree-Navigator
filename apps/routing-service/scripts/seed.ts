import { Client } from 'pg';
import fs from 'fs';
import path from 'path';

const safeNodes = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/safe-nodes.json'), 'utf8'));
const densityGrid = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/density-grid.json'), 'utf8'));

async function seedDatabase() {
    const client = new Client({
        user: 'fearfree_admin',
        password: 'supersecret',
        host: 'localhost',
        port: 5433,
        database: 'fearfree_db',
    });

    try {
        await client.connect();
        console.log("🟢 Connected to PostgreSQL.");

        await client.query('CREATE EXTENSION IF NOT EXISTS postgis;');
        console.log("🌐 PostGIS extension enabled.");

        await client.query(`
            DROP TABLE IF EXISTS safe_nodes;
            CREATE TABLE safe_nodes (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255),
                type VARCHAR(50),
                boost_value INTEGER,
                location GEOGRAPHY(Point, 4326) -- The PostGIS spatial data type
            );
        `);
        
        console.log(`📦 Inserting ${safeNodes.length} safe nodes...`);
        for (const node of safeNodes) {
            await client.query(`
                INSERT INTO safe_nodes (name, type, boost_value, location)
                VALUES ($1, $2, $3, ST_SetSRID(ST_MakePoint($4, $5), 4326)::geography)
            `, [node.name || 'Unknown', node.type || 'general', node.boost, node.lng, node.lat]);
        }

        await client.query(`
            DROP TABLE IF EXISTS density_zones;
            CREATE TABLE density_zones (
                id SERIAL PRIMARY KEY,
                density_score INTEGER,
                radius_meters INTEGER,
                location GEOGRAPHY(Point, 4326)
            );
        `);

        console.log(`📊 Inserting ${densityGrid.sectors.length} density sectors...`);
        for (const sector of densityGrid.sectors) {
            await client.query(`
                INSERT INTO density_zones (density_score, radius_meters, location)
                VALUES ($1, $2, ST_SetSRID(ST_MakePoint($3, $4), 4326)::geography)
            `, [sector.densityScore, sector.radius, sector.lng, sector.lat]);
        }

        await client.query('CREATE INDEX safe_nodes_gix ON safe_nodes USING GIST (location);');
        await client.query('CREATE INDEX density_zones_gix ON density_zones USING GIST (location);');
        console.log("⚡ Spatial indexes created.");

        console.log("✅ Database seeded successfully!");

    } catch (err) {
        console.error("❌ Seeding error:", err);
    } finally {
        await client.end();
    }
}

seedDatabase();