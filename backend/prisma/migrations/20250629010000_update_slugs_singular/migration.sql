-- Update category slugs from plural to singular
UPDATE "categories" SET "slug" = 'hombre' WHERE "slug" = 'hombres';
UPDATE "categories" SET "slug" = 'mujer' WHERE "slug" = 'mujeres';

UPDATE "categories" SET "slug" = 'hombre-standard' WHERE "slug" = 'hombres-standard';
UPDATE "categories" SET "slug" = 'hombre-latin' WHERE "slug" = 'hombres-latin';
UPDATE "categories" SET "slug" = 'mujer-standard' WHERE "slug" = 'mujeres-standard';
UPDATE "categories" SET "slug" = 'mujer-latin' WHERE "slug" = 'mujeres-latin';

UPDATE "categories" SET "slug" = 'hombre-latin-camisas' WHERE "slug" = 'hombres-latin-camisas';
UPDATE "categories" SET "slug" = 'hombre-latin-pantalones' WHERE "slug" = 'hombres-latin-pantalones';
UPDATE "categories" SET "slug" = 'mujer-latin-vestidos-competencia' WHERE "slug" = 'mujeres-latin-vestidos-competencia';
UPDATE "categories" SET "slug" = 'mujer-latin-ropa-practica' WHERE "slug" = 'mujeres-latin-ropa-practica';
UPDATE "categories" SET "slug" = 'mujer-latin-ropa-practica-tops' WHERE "slug" = 'mujeres-latin-ropa-practica-tops';
UPDATE "categories" SET "slug" = 'mujer-latin-ropa-practica-faldas' WHERE "slug" = 'mujeres-latin-ropa-practica-faldas';
