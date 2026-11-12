/*
 * continuum/charts: Continuum's chart kit, a separate entry from the library.
 *
 * Written for Continuum, with no dependencies of its own: React, Continuum's
 * own helpers in src/lib, and the maths in ./lib. A chart holds no colour or
 * size of its own either, only the tokens tokens.css sets (--color-chart-*,
 * the neutral ramp, the radii, the type), so a theme or mode switch restyles
 * every chart with it.
 *
 * A chart takes its rows and its series as props, so the scales are known in
 * one render: <AreaChart data={rows} x="date" series={[{ key: 'visitors' }]} />.
 */

export {};
