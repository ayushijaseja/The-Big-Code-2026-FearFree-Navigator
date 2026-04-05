import { pgTable, serial, varchar, integer, geometry } from 'drizzle-orm/pg-core';

export const safeNodesTable = pgTable('safe_nodes', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 255 }),
    type: varchar('type', { length: 50 }),
    boostValue: integer('boost_value'),
    location: geometry('location', { type: 'point', srid: 4326 }) 
});

export const densityZonesTable = pgTable('density_zones', {
    id: serial('id').primaryKey(),
    densityScore: integer('density_score'),
    radiusMeters: integer('radius_meters'),
    location: geometry('location', { type: 'point', srid: 4326 })
});