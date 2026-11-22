-- 139 species and 139 field plants for the Supabase catalogue.
-- Run this whole file once in the Supabase SQL editor.
-- Safe to run again: a species or plant that is already there is skipped.
-- Each plant is registered by a different active botanist, in staff-id order: plant 1 is B001, plant 2 is B002, then it repeats.
-- Each species and its field plant also get one photograph.
-- If only one botanist exists, every plant stays with that account.
-- The last 12 ordinary plants stay submitted for the officer queue. The rest are approved.
-- Rare plants stay off the public page.

begin;

create temp table seed_catalog (
  n integer primary key,
  scientific_name text not null,
  common_name text not null,
  local_name text not null,
  family text not null,
  genus text not null,
  description text not null,
  conservation_status text not null,
  distribution text not null,
  ecological_info text not null,
  cultural_significance text not null,
  plant_name text not null,
  life_stage text not null,
  height_m numeric not null,
  trunk_diameter_cm numeric not null,
  leaf_traits text not null,
  flower_fruit_traits text not null,
  health_status text not null,
  other_traits text not null,
  location_name text not null,
  latitude double precision not null,
  longitude double precision not null,
  visibility text not null,
  status text not null,
  local_id uuid not null,
  qr_code text not null
) on commit drop;

insert into seed_catalog (
  n, scientific_name, common_name, local_name, family, genus, description, conservation_status,
  distribution, ecological_info, cultural_significance, plant_name, life_stage, height_m,
  trunk_diameter_cm, leaf_traits, flower_fruit_traits, health_status, other_traits,
  location_name, latitude, longitude, visibility, status, local_id, qr_code
) values
  (1, 'Shorea leprosula', 'Light red meranti', 'Meranti tembaga', 'Dipterocarpaceae', 'Shorea', 'Tall dipterocarp with coppery young leaves and a straight bole.', 'Near Threatened', 'Peninsular Malaysia, Sumatra and Borneo', 'Emergent tree of lowland dipterocarp forest on well-drained slopes.', 'A main light-hardwood timber, sold as meranti.', 'Meranti tembaga', 'sapling', 4.9, 16.5, 'broad', 'none', 'healthy', 'Field note 001. Habit: tree. Crown and stem match a sapling healthy plant on the FRIM Rover track plot.', 'FRIM Rover track, Kepong', 3.23398, 101.6362, 'ordinary', 'approved', '00000001-4a20-4000-8000-000000000000'::uuid, 'plant-00000001'),
  (2, 'Shorea parvifolia', 'Dark red meranti', 'Meranti sarang punai', 'Dipterocarpaceae', 'Shorea', 'Large canopy tree with small leaves and a dark red heartwood.', 'Least Concern', 'Malay Peninsula, Sumatra and Borneo', 'Grows in mixed lowland forest, often on hillsides.', 'Timber tree; the Malay name refers to green-pigeon nests.', 'Meranti sarang punai', 'mature', 18.8, 53.0, 'broad', 'none', 'healthy', 'Field note 002. Habit: tree. Crown and stem match a mature healthy plant on the Perdana Botanical Garden plot.', 'Perdana Botanical Garden', 3.1428, 101.68508, 'ordinary', 'approved', '00000002-4a20-4000-8000-000000000000'::uuid, 'plant-00000002'),
  (3, 'Shorea curtisii', 'Seraya', 'Seraya', 'Dipterocarpaceae', 'Shorea', 'Hill dipterocarp with a pale bole and winged fruit.', 'Near Threatened', 'Peninsular Malaysia and southern Thailand', 'Dominates some hill ridges above the lowland forest.', 'Hill-forest timber, also called seraya.', 'Seraya', 'flowering', 17.2, 49.5, 'broad', 'flowers', 'healthy', 'Field note 003. Habit: tree. Crown and stem match a flowering healthy plant on the Perdana Lake edge plot.', 'Perdana Lake edge', 3.14132, 101.68632, 'ordinary', 'approved', '00000003-4a20-4000-8000-000000000000'::uuid, 'plant-00000003'),
  (4, 'Shorea ovalis', 'Meranti kepong', 'Meranti kepong', 'Dipterocarpaceae', 'Shorea', 'Large tree with oval leaves and a flaky bark.', 'Near Threatened', 'Peninsular Malaysia, Sumatra and Borneo', 'Lowland and hill forest on clay soils.', 'Commercial meranti; the name is tied to Kepong.', 'Meranti kepong', 'fruiting', 18.6, 46.0, 'broad', 'fruit', 'healthy', 'Field note 004. Habit: tree. Crown and stem match a fruiting healthy plant on the Bukit Nanas Forest Reserve plot.', 'Bukit Nanas Forest Reserve', 3.15264, 101.7032, 'ordinary', 'approved', '00000004-4a20-4000-8000-000000000000'::uuid, 'plant-00000004'),
  (5, 'Shorea macroptera', 'White meranti', 'Meranti melantai', 'Dipterocarpaceae', 'Shorea', 'Dipterocarp with large wings on the fruit and pale timber.', 'Least Concern', 'Sundaland', 'Common in lowland mixed forest.', 'Light hardwood used for furniture and plywood.', 'Meranti melantai', 'mature', 18.0, 50.5, 'broad', 'none', 'healthy', 'Field note 005. Habit: tree. Crown and stem match a mature healthy plant on the KLCC Park plot.', 'KLCC Park', 3.15336, 101.71288, 'ordinary', 'approved', '00000005-4a20-4000-8000-000000000000'::uuid, 'plant-00000005'),
  (6, 'Dipterocarpus grandiflorus', 'Large-flowered keruing', 'Keruing belimbing', 'Dipterocarpaceae', 'Dipterocarpus', 'Big tree with large fragrant flowers and resinous bark.', 'Vulnerable', 'Mainland Southeast Asia to Borneo', 'Lowland forest, often near streams.', 'Keruing timber and dammar resin.', 'Keruing belimbing', 'fruiting', 17.4, 51.0, 'broad', 'fruit', 'healthy', 'Field note 006. Habit: tree. Crown and stem match a fruiting healthy plant on the Taman Tugu plot.', 'Taman Tugu', 3.15218, 101.68242, 'ordinary', 'approved', '00000006-4a20-4000-8000-000000000000'::uuid, 'plant-00000006'),
  (7, 'Dipterocarpus baudii', 'Keruing bulu', 'Keruing bulu', 'Dipterocarpaceae', 'Dipterocarpus', 'Keruing with hairy twigs and a tall cylindrical trunk.', 'Near Threatened', 'Thailand, Peninsular Malaysia and Sumatra', 'Lowland dipterocarp forest.', 'Structural timber.', 'Keruing bulu', 'flowering', 16.8, 49.5, 'broad', 'flowers', 'fair', 'Field note 007. Habit: tree. Crown and stem match a flowering fair plant on the Rimba Ilmu plot.', 'Rimba Ilmu, Universiti Malaya', 3.1308, 101.6564, 'ordinary', 'approved', '00000007-4a20-4000-8000-000000000000'::uuid, 'plant-00000007'),
  (8, 'Dryobalanops aromatica', 'Borneo camphor', 'Kapur', 'Dipterocarpaceae', 'Dryobalanops', 'Giant tree whose wood and resin smell of camphor.', 'Vulnerable', 'Peninsular Malaysia, Sumatra and Borneo', 'Emergent of lowland forest on deep soils.', 'Historic source of camphor and kapur timber.', 'Kapur', 'seedling', 2.0, 3.0, 'broad', 'none', 'healthy', 'Field note 008. Habit: tree. Crown and stem match a seedling healthy plant on the Bukit Gasing forest plot.', 'Bukit Gasing forest', 3.09562, 101.65888, 'ordinary', 'approved', '00000008-4a20-4000-8000-000000000000'::uuid, 'plant-00000008'),
  (9, 'Hopea odorata', 'Merawan', 'Merawan siput jantan', 'Dipterocarpaceae', 'Hopea', 'Medium to large tree with fragrant flowers and a dark crown.', 'Least Concern', 'Indochina to northern Peninsular Malaysia', 'Riverbanks and lowland forest, also planted in towns.', 'Shade tree and light hardwood.', 'Merawan siput jantan', 'sapling', 6.1, 16.5, 'broad', 'none', 'healthy', 'Field note 009. Habit: tree. Crown and stem match a sapling healthy plant on the Kota Damansara Community Forest plot.', 'Kota Damansara Community Forest', 3.16924, 101.58212, 'ordinary', 'approved', '00000009-4a20-4000-8000-000000000000'::uuid, 'plant-00000009'),
  (10, 'Hopea beccariana', 'Merawan batu', 'Merawan', 'Dipterocarpaceae', 'Hopea', 'Slow-growing dipterocarp with hard, heavy wood.', 'Vulnerable', 'Peninsular Malaysia and Borneo', 'Lowland forest on ridges.', 'Durable timber, now less common in logged forest.', 'Merawan', 'mature', 18.0, 53.0, 'broad', 'none', 'healthy', 'Field note 010. Habit: tree. Crown and stem match a mature healthy plant on the Taman Botani Negara Shah Alam plot.', 'Taman Botani Negara Shah Alam', 3.09776, 101.5068, 'ordinary', 'approved', '0000000a-4a20-4000-8000-000000000000'::uuid, 'plant-0000000a'),
  (11, 'Vatica odorata', 'Resak', 'Resak', 'Dipterocarpaceae', 'Vatica', 'Smaller dipterocarp with fragrant white flowers.', 'Near Threatened', 'Southeast Asia', 'Understorey to canopy of lowland forest.', 'Resak timber and ornamental planting.', 'Resak', 'flowering', 16.4, 49.5, 'broad', 'flowers', 'healthy', 'Field note 011. Habit: tree. Crown and stem match a flowering healthy plant on the Putrajaya Botanical Garden plot.', 'Putrajaya Botanical Garden', 2.94438, 101.69988, 'ordinary', 'approved', '0000000b-4a20-4000-8000-000000000000'::uuid, 'plant-0000000b'),
  (12, 'Anisoptera costata', 'Mersawa', 'Mersawa', 'Dipterocarpaceae', 'Anisoptera', 'Very tall tree with a long clear bole.', 'Endangered', 'Mainland Southeast Asia to Borneo', 'Lowland forest; heavily logged across its range.', 'Mersawa timber. Marked rare in this catalogue.', 'Mersawa', 'fruiting', 17.8, 46.0, 'broad', 'fruit', 'healthy', 'Field note 012. Habit: tree. Crown and stem match a fruiting healthy plant on the Penang Botanic Gardens plot.', 'Penang Botanic Gardens', 5.4376, 100.29072, 'rare', 'approved', '0000000c-4a20-4000-8000-000000000000'::uuid, 'plant-0000000c'),
  (13, 'Neobalanocarpus heimii', 'Chengal', 'Chengal', 'Dipterocarpaceae', 'Neobalanocarpus', 'Slow giant with extremely hard, durable wood.', 'Vulnerable', 'Peninsular Malaysia and southern Thailand', 'Lowland forest, now scarce as large trees.', 'Traditional palace and boat timber. Kept as a rare record.', 'Chengal', 'mature', 19.2, 50.5, 'broad', 'none', 'healthy', 'Field note 013. Habit: tree. Crown and stem match a mature healthy plant on the Kuala Selangor Nature Park plot.', 'Kuala Selangor Nature Park', 3.33982, 101.2458, 'rare', 'approved', '0000000d-4a20-4000-8000-000000000000'::uuid, 'plant-0000000d'),
  (14, 'Parashorea malaanonan', 'White seraya', 'Urat mata', 'Dipterocarpaceae', 'Parashorea', 'Large tree with prominent leaf veins.', 'Least Concern', 'Borneo and the Philippines', 'Lowland and hill dipterocarp forest.', 'Timber grouped with white seraya.', 'Urat mata', 'fruiting', 18.6, 51.0, 'broad', 'fruit', 'fair', 'Field note 014. Habit: tree. Crown and stem match a fruiting fair plant on the FRIM canopy walk plot.', 'FRIM canopy walk, Kepong', 3.23874, 101.63328, 'ordinary', 'approved', '0000000e-4a20-4000-8000-000000000000'::uuid, 'plant-0000000e'),
  (15, 'Cotylelobium melanoxylon', 'Resak batu', 'Resak hitam', 'Dipterocarpaceae', 'Cotylelobium', 'Dipterocarp with dark, hard wood.', 'Vulnerable', 'Peninsular Malaysia, Sumatra and Borneo', 'Ridge forest and sandy soils.', 'Heavy construction timber.', 'Resak hitam', 'flowering', 16.0, 49.5, 'broad', 'flowers', 'healthy', 'Field note 015. Habit: tree. Crown and stem match a flowering healthy plant on the FRIM Rover track plot.', 'FRIM Rover track, Kepong', 3.23356, 101.63572, 'ordinary', 'approved', '0000000f-4a20-4000-8000-000000000000'::uuid, 'plant-0000000f'),
  (16, 'Koompassia excelsa', 'Tualang', 'Tualang', 'Fabaceae', 'Koompassia', 'Among the tallest rainforest trees, with huge buttresses.', 'Least Concern', 'Peninsular Malaysia, Sumatra and Borneo', 'Emergent; honey bees often nest in the crown.', 'Left standing by honey collectors; not a preferred timber.', 'Tualang', 'seedling', 1.2, 3.0, 'compound', 'none', 'healthy', 'Field note 016. Habit: tree. Crown and stem match a seedling healthy plant on the Perdana Botanical Garden plot.', 'Perdana Botanical Garden', 3.14238, 101.6846, 'ordinary', 'approved', '00000010-4a20-4000-8000-000000000000'::uuid, 'plant-00000010'),
  (17, 'Koompassia malaccensis', 'Kempas', 'Kempas', 'Fabaceae', 'Koompassia', 'Tall legume tree with a fluted trunk.', 'Least Concern', 'Peninsular Malaysia, Sumatra and Borneo', 'Lowland forest, including swamp edges.', 'Heavy hardwood for sleepers and flooring.', 'Kempas', 'sapling', 5.3, 16.5, 'compound', 'none', 'poor', 'Field note 017. Habit: tree. Crown and stem match a sapling poor plant on the Perdana Lake edge plot.', 'Perdana Lake edge', 3.1409, 101.68728, 'ordinary', 'approved', '00000011-4a20-4000-8000-000000000000'::uuid, 'plant-00000011'),
  (18, 'Intsia palembanica', 'Merbau', 'Merbau', 'Fabaceae', 'Intsia', 'Large tree with dark brown, durable heartwood.', 'Near Threatened', 'Southeast Asia to New Guinea', 'Lowland and coastal forest.', 'High-value flooring timber.', 'Merbau', 'mature', 19.2, 53.0, 'compound', 'none', 'healthy', 'Field note 018. Habit: tree. Crown and stem match a mature healthy plant on the Bukit Nanas Forest Reserve plot.', 'Bukit Nanas Forest Reserve', 3.15222, 101.70272, 'ordinary', 'approved', '00000012-4a20-4000-8000-000000000000'::uuid, 'plant-00000012'),
  (19, 'Dialium indum', 'Velvet tamarind', 'Keranji', 'Fabaceae', 'Dialium', 'Tree with small brown edible pods and a dense crown.', 'Least Concern', 'Thailand to Borneo', 'Lowland forest and village edges.', 'The sour pulp is eaten as a snack.', 'Keranji', 'flowering', 17.6, 49.5, 'compound', 'flowers', 'healthy', 'Field note 019. Habit: tree. Crown and stem match a flowering healthy plant on the KLCC Park plot.', 'KLCC Park', 3.15504, 101.7124, 'ordinary', 'approved', '00000013-4a20-4000-8000-000000000000'::uuid, 'plant-00000013'),
  (20, 'Sindora coriacea', 'Sepetir', 'Sepetir', 'Fabaceae', 'Sindora', 'Legume tree with leathery pods and a straight bole.', 'Least Concern', 'Peninsular Malaysia and Sumatra', 'Lowland forest.', 'Sepetir timber and shade.', 'Sepetir', 'fruiting', 17.0, 46.0, 'compound', 'fruit', 'healthy', 'Field note 020. Habit: tree. Crown and stem match a fruiting healthy plant on the Taman Tugu plot.', 'Taman Tugu', 3.15176, 101.68338, 'ordinary', 'approved', '00000014-4a20-4000-8000-000000000000'::uuid, 'plant-00000014'),
  (21, 'Parkia speciosa', 'Petai', 'Petai', 'Fabaceae', 'Parkia', 'Tree with long pods of strong-smelling green seeds.', 'Least Concern', 'Thailand, Malaysia, Indonesia', 'Forest edges and orchards.', 'The beans are a common Malay vegetable.', 'Petai', 'mature', 18.4, 50.5, 'compound', 'none', 'fair', 'Field note 021. Habit: tree. Crown and stem match a mature fair plant on the Rimba Ilmu plot.', 'Rimba Ilmu, Universiti Malaya', 3.13038, 101.65592, 'ordinary', 'approved', '00000015-4a20-4000-8000-000000000000'::uuid, 'plant-00000015'),
  (22, 'Archidendron jiringa', 'Jering', 'Jering', 'Fabaceae', 'Archidendron', 'Tree with twisted purple pods.', 'Least Concern', 'Peninsular Malaysia and Sumatra', 'Secondary forest and villages.', 'Seeds are boiled and eaten; raw seeds can upset the stomach.', 'Jering', 'fruiting', 17.8, 51.0, 'compound', 'fruit', 'healthy', 'Field note 022. Habit: tree. Crown and stem match a fruiting healthy plant on the Bukit Gasing forest plot.', 'Bukit Gasing forest', 3.0952, 101.6584, 'ordinary', 'approved', '00000016-4a20-4000-8000-000000000000'::uuid, 'plant-00000016'),
  (23, 'Tamarindus indica', 'Tamarind', 'Asam jawa', 'Fabaceae', 'Tamarindus', 'Spreading tree with sour brown pods and fine leaflets.', 'Least Concern', 'Planted throughout the tropics', 'Open ground, roadsides and home gardens.', 'Pulp is used in cooking and drinks.', 'Asam jawa', 'flowering', 17.2, 49.5, 'compound', 'flowers', 'healthy', 'Field note 023. Habit: tree. Crown and stem match a flowering healthy plant on the Kota Damansara Community Forest plot.', 'Kota Damansara Community Forest', 3.16882, 101.58308, 'ordinary', 'approved', '00000017-4a20-4000-8000-000000000000'::uuid, 'plant-00000017'),
  (24, 'Delonix regia', 'Flame tree', 'Semarak api', 'Fabaceae', 'Delonix', 'Wide crown covered in scarlet flowers in the dry months.', 'Least Concern', 'Planted throughout the tropics', 'Streets, parks and school grounds.', 'A common ornamental shade tree.', 'Semarak api', 'seedling', 2.4, 3.0, 'compound', 'none', 'healthy', 'Field note 024. Habit: tree. Crown and stem match a seedling healthy plant on the Taman Botani Negara Shah Alam plot.', 'Taman Botani Negara Shah Alam', 3.09944, 101.50632, 'ordinary', 'approved', '00000018-4a20-4000-8000-000000000000'::uuid, 'plant-00000018'),
  (25, 'Cassia fistula', 'Golden shower', 'Raja kayu', 'Fabaceae', 'Cassia', 'Medium tree with long hanging clusters of yellow flowers.', 'Least Concern', 'South and Southeast Asia', 'Open woodland and parks.', 'Planted for flowers; the pulp is a traditional laxative.', 'Raja kayu', 'sapling', 4.5, 16.5, 'compound', 'none', 'healthy', 'Field note 025. Habit: tree. Crown and stem match a sapling healthy plant on the Putrajaya Botanical Garden plot.', 'Putrajaya Botanical Garden', 2.94396, 101.6994, 'ordinary', 'approved', '00000019-4a20-4000-8000-000000000000'::uuid, 'plant-00000019'),
  (26, 'Senna alata', 'Candle bush', 'Gelenggang', 'Fabaceae', 'Senna', 'Shrub with upright yellow flower spikes and large leaflets.', 'Least Concern', 'Tropics worldwide', 'Roadsides and damp open ground.', 'Leaves are a folk treatment for ringworm.', 'Gelenggang', 'mature', 2.35, 6.8, 'compound', 'none', 'healthy', 'Field note 026. Habit: shrub. Crown and stem match a mature healthy plant on the Penang Botanic Gardens plot.', 'Penang Botanic Gardens', 5.43718, 100.29168, 'ordinary', 'approved', '0000001a-4a20-4000-8000-000000000000'::uuid, 'plant-0000001a'),
  (27, 'Peltophorum pterocarpum', 'Yellow flame', 'Batai laut', 'Fabaceae', 'Peltophorum', 'Broad shade tree with rust-yellow flower clusters.', 'Least Concern', 'Southeast Asia to northern Australia', 'Coasts, parks and avenues.', 'Street tree; bark has been used for dye.', 'Batai laut', 'flowering', 16.8, 49.5, 'compound', 'flowers', 'healthy', 'Field note 027. Habit: tree. Crown and stem match a flowering healthy plant on the Kuala Selangor Nature Park plot.', 'Kuala Selangor Nature Park', 3.3394, 101.24532, 'ordinary', 'approved', '0000001b-4a20-4000-8000-000000000000'::uuid, 'plant-0000001b'),
  (28, 'Samanea saman', 'Rain tree', 'Hujan-hujan', 'Fabaceae', 'Samanea', 'Very wide crown; leaves fold in rain and at night.', 'Least Concern', 'Planted throughout the tropics', 'Parks and roadsides.', 'Shade tree. Leaflets can drip honeydew, hence the Malay name.', 'Hujan-hujan', 'fruiting', 18.2, 46.0, 'compound', 'fruit', 'fair', 'Field note 028. Habit: tree. Crown and stem match a fruiting fair plant on the FRIM canopy walk plot.', 'FRIM canopy walk, Kepong', 3.23832, 101.6328, 'ordinary', 'approved', '0000001c-4a20-4000-8000-000000000000'::uuid, 'plant-0000001c'),
  (29, 'Adenanthera pavonina', 'Red bead tree', 'Saga', 'Fabaceae', 'Adenanthera', 'Tree with curling pods of hard red seeds.', 'Least Concern', 'South and Southeast Asia', 'Secondary forest and gardens.', 'Seeds are used as beads and in games.', 'Saga', 'mature', 19.6, 50.5, 'compound', 'none', 'healthy', 'Field note 029. Habit: tree. Crown and stem match a mature healthy plant on the FRIM Rover track plot.', 'FRIM Rover track, Kepong', 3.23524, 101.63668, 'ordinary', 'approved', '0000001d-4a20-4000-8000-000000000000'::uuid, 'plant-0000001d'),
  (30, 'Pterocarpus indicus', 'Angsana', 'Angsana', 'Fabaceae', 'Pterocarpus', 'Spreading tree with yellow flowers and blood-red sap.', 'Endangered', 'Southeast Asia', 'Lowland forest and, widely, city streets.', 'National roadside tree in parts of the region. Rare record because wild trees are depleted.', 'Angsana', 'fruiting', 17.0, 51.0, 'compound', 'fruit', 'healthy', 'Field note 030. Habit: tree. Crown and stem match a fruiting healthy plant on the Perdana Botanical Garden plot.', 'Perdana Botanical Garden', 3.14196, 101.68412, 'rare', 'approved', '0000001e-4a20-4000-8000-000000000000'::uuid, 'plant-0000001e'),
  (31, 'Bauhinia purpurea', 'Butterfly tree', 'Tapak kuda', 'Fabaceae', 'Bauhinia', 'Small tree with twin-lobed leaves and purple flowers.', 'Least Concern', 'South and Southeast Asia', 'Forest edges and gardens.', 'Ornamental. Leaves are sometimes eaten as a vegetable.', 'Tapak kuda', 'flowering', 16.4, 49.5, 'compound', 'flowers', 'healthy', 'Field note 031. Habit: tree. Crown and stem match a flowering healthy plant on the Perdana Lake edge plot.', 'Perdana Lake edge', 3.14048, 101.6868, 'ordinary', 'approved', '0000001f-4a20-4000-8000-000000000000'::uuid, 'plant-0000001f'),
  (32, 'Caesalpinia pulcherrima', 'Peacock flower', 'Jambul merak', 'Fabaceae', 'Caesalpinia', 'Open shrub with red and yellow flowers and fine leaves.', 'Least Concern', 'Planted throughout the tropics', 'Sunny hedges and parks.', 'Ornamental hedge plant.', 'Jambul merak', 'seedling', 0.6, 1.0, 'compound', 'none', 'healthy', 'Field note 032. Habit: shrub. Crown and stem match a seedling healthy plant on the Bukit Nanas Forest Reserve plot.', 'Bukit Nanas Forest Reserve', 3.1518, 101.70368, 'ordinary', 'approved', '00000020-4a20-4000-8000-000000000000'::uuid, 'plant-00000020'),
  (33, 'Ficus benjamina', 'Weeping fig', 'Beringin', 'Moraceae', 'Ficus', 'Dense drooping crown and aerial roots on older trees.', 'Least Concern', 'South and Southeast Asia', 'Forest and town squares.', 'Shade tree; strangler figs of this group start life on other trees.', 'Beringin', 'sapling', 5.7, 16.5, 'broad', 'none', 'healthy', 'Field note 033. Habit: tree. Crown and stem match a sapling healthy plant on the KLCC Park plot.', 'KLCC Park', 3.15462, 101.71192, 'ordinary', 'approved', '00000021-4a20-4000-8000-000000000000'::uuid, 'plant-00000021'),
  (34, 'Ficus religiosa', 'Sacred fig', 'Ara', 'Moraceae', 'Ficus', 'Heart-shaped leaves with a long drip tip.', 'Least Concern', 'South and Southeast Asia', 'Temple grounds and lowland forest.', 'Sacred in Buddhist tradition as the Bodhi tree.', 'Ara', 'mature', 19.6, 53.0, 'broad', 'none', 'poor', 'Field note 034. Habit: tree. Crown and stem match a mature poor plant on the Taman Tugu plot.', 'Taman Tugu', 3.15344, 101.6829, 'ordinary', 'approved', '00000022-4a20-4000-8000-000000000000'::uuid, 'plant-00000022'),
  (35, 'Ficus racemosa', 'Cluster fig', 'Ara berduri', 'Moraceae', 'Ficus', 'Figs borne in clusters on the trunk and main branches.', 'Least Concern', 'South and Southeast Asia to Australia', 'Riverbanks and open forest.', 'Fruit feeds birds, bats and people.', 'Ara berduri', 'flowering', 16.0, 49.5, 'broad', 'flowers', 'fair', 'Field note 035. Habit: tree. Crown and stem match a flowering fair plant on the Rimba Ilmu plot.', 'Rimba Ilmu, Universiti Malaya', 3.12996, 101.65688, 'ordinary', 'approved', '00000023-4a20-4000-8000-000000000000'::uuid, 'plant-00000023'),
  (36, 'Ficus microcarpa', 'Chinese banyan', 'Jejawi', 'Moraceae', 'Ficus', 'Banyan with small leaves and curtains of aerial roots.', 'Least Concern', 'Tropical Asia to Australia', 'Rocky coasts and town parks.', 'A familiar shade and bonsai species.', 'Jejawi', 'fruiting', 17.4, 46.0, 'broad', 'fruit', 'healthy', 'Field note 036. Habit: tree. Crown and stem match a fruiting healthy plant on the Bukit Gasing forest plot.', 'Bukit Gasing forest', 3.09478, 101.65792, 'ordinary', 'approved', '00000024-4a20-4000-8000-000000000000'::uuid, 'plant-00000024'),
  (37, 'Artocarpus heterophyllus', 'Jackfruit', 'Nangka', 'Moraceae', 'Artocarpus', 'Large compound fruit growing from the trunk and branches.', 'Least Concern', 'Planted throughout tropical Asia', 'Home gardens and orchards.', 'Staple fruit; seeds are boiled or roasted.', 'Nangka', 'mature', 18.8, 50.5, 'broad', 'none', 'healthy', 'Field note 037. Habit: tree. Crown and stem match a mature healthy plant on the Kota Damansara Community Forest plot.', 'Kota Damansara Community Forest', 3.1684, 101.5826, 'ordinary', 'approved', '00000025-4a20-4000-8000-000000000000'::uuid, 'plant-00000025'),
  (38, 'Artocarpus integer', 'Cempedak', 'Cempedak', 'Moraceae', 'Artocarpus', 'Like jackfruit, with a stronger scent and softer pulp.', 'Least Concern', 'Peninsular Malaysia, Sumatra and Borneo', 'Villages and forest edges.', 'Eaten fresh and in fritters.', 'Cempedak', 'fruiting', 18.2, 51.0, 'broad', 'fruit', 'healthy', 'Field note 038. Habit: tree. Crown and stem match a fruiting healthy plant on the Taman Botani Negara Shah Alam plot.', 'Taman Botani Negara Shah Alam', 3.09902, 101.50728, 'ordinary', 'approved', '00000026-4a20-4000-8000-000000000000'::uuid, 'plant-00000026'),
  (39, 'Artocarpus altilis', 'Breadfruit', 'Sukun', 'Moraceae', 'Artocarpus', 'Large lobed leaves and starchy round fruit.', 'Least Concern', 'Pacific and Southeast Asia', 'Gardens and coastal villages.', 'Fruit is cooked as a staple.', 'Sukun', 'flowering', 17.6, 49.5, 'broad', 'flowers', 'healthy', 'Field note 039. Habit: tree. Crown and stem match a flowering healthy plant on the Putrajaya Botanical Garden plot.', 'Putrajaya Botanical Garden', 2.94564, 101.69892, 'ordinary', 'approved', '00000027-4a20-4000-8000-000000000000'::uuid, 'plant-00000027'),
  (40, 'Artocarpus odoratissimus', 'Terap', 'Terap', 'Moraceae', 'Artocarpus', 'Forest tree with sweet, strongly scented fruit.', 'Least Concern', 'Borneo and the southern Philippines', 'Lowland forest.', 'Wild and village fruit tree.', 'Terap', 'seedling', 0.8, 3.0, 'broad', 'none', 'healthy', 'Field note 040. Habit: tree. Crown and stem match a seedling healthy plant on the Penang Botanic Gardens plot.', 'Penang Botanic Gardens', 5.43676, 100.2912, 'ordinary', 'approved', '00000028-4a20-4000-8000-000000000000'::uuid, 'plant-00000028'),
  (41, 'Mangifera indica', 'Mango', 'Mangga', 'Anacardiaceae', 'Mangifera', 'Dense evergreen crown and sweet fleshy fruit.', 'Least Concern', 'Planted throughout the tropics', 'Orchards and home gardens.', 'A leading tropical fruit.', 'Mangga', 'sapling', 4.9, 16.5, 'broad', 'none', 'healthy', 'Field note 041. Habit: tree. Crown and stem match a sapling healthy plant on the Kuala Selangor Nature Park plot.', 'Kuala Selangor Nature Park', 3.33898, 101.24628, 'ordinary', 'approved', '00000029-4a20-4000-8000-000000000000'::uuid, 'plant-00000029'),
  (42, 'Mangifera odorata', 'Kuini', 'Kuini', 'Anacardiaceae', 'Mangifera', 'Mango relative with fragrant, fibrous fruit.', 'Least Concern', 'Peninsular Malaysia and western Indonesia', 'Villages and old orchards.', 'Eaten ripe and used in sambal.', 'Kuini', 'mature', 18.8, 53.0, 'broad', 'none', 'fair', 'Field note 042. Habit: tree. Crown and stem match a mature fair plant on the FRIM canopy walk plot.', 'FRIM canopy walk, Kepong', 3.2379, 101.63232, 'ordinary', 'approved', '0000002a-4a20-4000-8000-000000000000'::uuid, 'plant-0000002a'),
  (43, 'Mangifera foetida', 'Bachang', 'Bacang', 'Anacardiaceae', 'Mangifera', 'Tall wild mango with turpentine-scented fruit.', 'Least Concern', 'Peninsular Malaysia, Sumatra and Borneo', 'Lowland forest and villages.', 'Young fruit is cooked; the sap can irritate skin.', 'Bacang', 'flowering', 17.2, 49.5, 'broad', 'flowers', 'healthy', 'Field note 043. Habit: tree. Crown and stem match a flowering healthy plant on the FRIM Rover track plot.', 'FRIM Rover track, Kepong', 3.23482, 101.6362, 'ordinary', 'approved', '0000002b-4a20-4000-8000-000000000000'::uuid, 'plant-0000002b'),
  (44, 'Anacardium occidentale', 'Cashew', 'Gajus', 'Anacardiaceae', 'Anacardium', 'Spreading tree; the nut hangs below a swollen fruit stalk.', 'Least Concern', 'Planted throughout the tropics', 'Sandy soils and smallholdings.', 'Nuts are roasted. The raw shell oil is caustic.', 'Gajus', 'fruiting', 18.6, 46.0, 'broad', 'fruit', 'healthy', 'Field note 044. Habit: tree. Crown and stem match a fruiting healthy plant on the Perdana Botanical Garden plot.', 'Perdana Botanical Garden', 3.14364, 101.68508, 'ordinary', 'approved', '0000002c-4a20-4000-8000-000000000000'::uuid, 'plant-0000002c'),
  (45, 'Bouea macrophylla', 'Gandaria', 'Kundang', 'Anacardiaceae', 'Bouea', 'Small mango-like fruit on a neat evergreen tree.', 'Least Concern', 'Peninsular Malaysia, Sumatra and Borneo', 'Forest and home gardens.', 'Sour fruit for drinks and pickles.', 'Kundang', 'mature', 18.0, 50.5, 'broad', 'none', 'healthy', 'Field note 045. Habit: tree. Crown and stem match a mature healthy plant on the Perdana Lake edge plot.', 'Perdana Lake edge', 3.14006, 101.68632, 'ordinary', 'approved', '0000002d-4a20-4000-8000-000000000000'::uuid, 'plant-0000002d'),
  (46, 'Spondias dulcis', 'Ambarella', 'Kedondong', 'Anacardiaceae', 'Spondias', 'Open crown and crisp, sour fruit.', 'Least Concern', 'Planted throughout Southeast Asia', 'Gardens and roadsides.', 'Fruit is eaten fresh with salt and chilli.', 'Kedondong', 'fruiting', 17.4, 51.0, 'broad', 'fruit', 'healthy', 'Field note 046. Habit: tree. Crown and stem match a fruiting healthy plant on the Bukit Nanas Forest Reserve plot.', 'Bukit Nanas Forest Reserve', 3.15138, 101.7032, 'ordinary', 'approved', '0000002e-4a20-4000-8000-000000000000'::uuid, 'plant-0000002e'),
  (47, 'Durio zibethinus', 'Durian', 'Durian', 'Malvaceae', 'Durio', 'Large trunk, cauliflorous flowers, and spiny fruit.', 'Least Concern', 'Cultivated across Southeast Asia', 'Orchards and lowland forest edges.', 'The most famous regional fruit.', 'Durian', 'flowering', 16.8, 49.5, 'broad', 'flowers', 'healthy', 'Field note 047. Habit: tree. Crown and stem match a flowering healthy plant on the KLCC Park plot.', 'KLCC Park', 3.1542, 101.71288, 'ordinary', 'approved', '0000002f-4a20-4000-8000-000000000000'::uuid, 'plant-0000002f'),
  (48, 'Durio graveolens', 'Red durian', 'Durian merah', 'Malvaceae', 'Durio', 'Wild durian with red or orange flesh.', 'Least Concern', 'Borneo and Sumatra', 'Lowland rainforest.', 'Eaten by people and by orangutans.', 'Durian merah', 'seedling', 2.0, 3.0, 'broad', 'none', 'healthy', 'Field note 048. Habit: tree. Crown and stem match a seedling healthy plant on the Taman Tugu plot.', 'Taman Tugu', 3.15302, 101.68242, 'ordinary', 'approved', '00000030-4a20-4000-8000-000000000000'::uuid, 'plant-00000030'),
  (49, 'Nephelium lappaceum', 'Rambutan', 'Rambutan', 'Sapindaceae', 'Nephelium', 'Hairy red fruit and a dense garden crown.', 'Least Concern', 'Cultivated across Southeast Asia', 'Orchards and villages.', 'A main market fruit.', 'Rambutan', 'sapling', 6.1, 16.5, 'compound', 'none', 'fair', 'Field note 049. Habit: tree. Crown and stem match a sapling fair plant on the Rimba Ilmu plot.', 'Rimba Ilmu, Universiti Malaya', 3.13164, 101.6564, 'ordinary', 'approved', '00000031-4a20-4000-8000-000000000000'::uuid, 'plant-00000031'),
  (50, 'Nephelium mutabile', 'Pulasan', 'Pulasan', 'Sapindaceae', 'Nephelium', 'Like rambutan, with a thicker, smoother skin.', 'Least Concern', 'Peninsular Malaysia, Sumatra and Borneo', 'Forest and orchards.', 'Eaten fresh; less widely planted than rambutan.', 'Pulasan', 'mature', 18.0, 53.0, 'compound', 'none', 'healthy', 'Field note 050. Habit: tree. Crown and stem match a mature healthy plant on the Bukit Gasing forest plot.', 'Bukit Gasing forest', 3.09436, 101.65888, 'ordinary', 'approved', '00000032-4a20-4000-8000-000000000000'::uuid, 'plant-00000032'),
  (51, 'Lansium domesticum', 'Langsat', 'Langsat', 'Meliaceae', 'Lansium', 'Small tree with clusters of translucent sour-sweet fruit.', 'Least Concern', 'Cultivated across Southeast Asia', 'Orchards and forest gardens.', 'Fruit is sold in season; bark has traditional uses.', 'Langsat', 'flowering', 16.4, 49.5, 'compound', 'flowers', 'poor', 'Field note 051. Habit: tree. Crown and stem match a flowering poor plant on the Kota Damansara Community Forest plot.', 'Kota Damansara Community Forest', 3.16798, 101.58212, 'ordinary', 'approved', '00000033-4a20-4000-8000-000000000000'::uuid, 'plant-00000033'),
  (52, 'Dimocarpus longan', 'Longan', 'Mata kucing', 'Sapindaceae', 'Dimocarpus', 'Small brown fruit with a black seed like a cat eye.', 'Least Concern', 'South and Southeast Asia', 'Orchards and lowland forest.', 'Eaten fresh and dried.', 'Mata kucing', 'fruiting', 17.8, 46.0, 'compound', 'fruit', 'healthy', 'Field note 052. Habit: tree. Crown and stem match a fruiting healthy plant on the Taman Botani Negara Shah Alam plot.', 'Taman Botani Negara Shah Alam', 3.0986, 101.5068, 'ordinary', 'approved', '00000034-4a20-4000-8000-000000000000'::uuid, 'plant-00000034'),
  (53, 'Baccaurea motleyana', 'Rambai', 'Rambai', 'Phyllanthaceae', 'Baccaurea', 'Strings of pale fruit hang from the trunk and branches.', 'Least Concern', 'Peninsular Malaysia, Sumatra and Borneo', 'Villages and riverine forest.', 'A traditional home-garden fruit.', 'Rambai', 'mature', 19.2, 50.5, 'broad', 'none', 'healthy', 'Field note 053. Habit: tree. Crown and stem match a mature healthy plant on the Putrajaya Botanical Garden plot.', 'Putrajaya Botanical Garden', 2.94522, 101.69988, 'ordinary', 'approved', '00000035-4a20-4000-8000-000000000000'::uuid, 'plant-00000035'),
  (54, 'Garcinia mangostana', 'Mangosteen', 'Manggis', 'Clusiaceae', 'Garcinia', 'Slow evergreen with a thick purple rind and white segments.', 'Least Concern', 'Cultivated across Southeast Asia', 'Orchards in humid lowlands.', 'A prized dessert fruit.', 'Manggis', 'fruiting', 18.6, 51.0, 'broad', 'fruit', 'healthy', 'Field note 054. Habit: tree. Crown and stem match a fruiting healthy plant on the Penang Botanic Gardens plot.', 'Penang Botanic Gardens', 5.43844, 100.29072, 'ordinary', 'approved', '00000036-4a20-4000-8000-000000000000'::uuid, 'plant-00000036'),
  (55, 'Garcinia atroviridis', 'Asam gelugor', 'Asam gelugur', 'Clusiaceae', 'Garcinia', 'Tall tree with deeply ribbed sour fruit.', 'Least Concern', 'Peninsular Malaysia, Thailand and Sumatra', 'Forest and village orchards.', 'Dried slices flavour curries.', 'Asam gelugur', 'flowering', 16.0, 49.5, 'broad', 'flowers', 'healthy', 'Field note 055. Habit: tree. Crown and stem match a flowering healthy plant on the Kuala Selangor Nature Park plot.', 'Kuala Selangor Nature Park', 3.33856, 101.2458, 'ordinary', 'approved', '00000037-4a20-4000-8000-000000000000'::uuid, 'plant-00000037'),
  (56, 'Syzygium aqueum', 'Water apple', 'Jambu air', 'Myrtaceae', 'Syzygium', 'Small tree with shiny leaves and crisp pink fruit.', 'Least Concern', 'Cultivated across Southeast Asia', 'Gardens and wet ground.', 'Fruit is eaten fresh.', 'Jambu air', 'seedling', 1.2, 3.0, 'broad', 'none', 'fair', 'Field note 056. Habit: tree. Crown and stem match a seedling fair plant on the FRIM canopy walk plot.', 'FRIM canopy walk, Kepong', 3.23748, 101.63328, 'ordinary', 'approved', '00000038-4a20-4000-8000-000000000000'::uuid, 'plant-00000038'),
  (57, 'Syzygium malaccense', 'Malay apple', 'Jambu bol', 'Myrtaceae', 'Syzygium', 'Glossy tree with crimson flowers on the branches and pear-shaped fruit.', 'Least Concern', 'Malesia', 'Villages and forest edges.', 'Ornamental and fruit tree.', 'Jambu bol', 'sapling', 5.3, 16.5, 'broad', 'none', 'healthy', 'Field note 057. Habit: tree. Crown and stem match a sapling healthy plant on the FRIM Rover track plot.', 'FRIM Rover track, Kepong', 3.2344, 101.63572, 'ordinary', 'approved', '00000039-4a20-4000-8000-000000000000'::uuid, 'plant-00000039'),
  (58, 'Syzygium samarangense', 'Wax apple', 'Jambu semarang', 'Myrtaceae', 'Syzygium', 'Bell-shaped waxy fruit, often pink or green.', 'Least Concern', 'Cultivated across Southeast Asia', 'Commercial orchards and gardens.', 'A common market fruit.', 'Jambu semarang', 'mature', 19.2, 53.0, 'broad', 'none', 'healthy', 'Field note 058. Habit: tree. Crown and stem match a mature healthy plant on the Perdana Botanical Garden plot.', 'Perdana Botanical Garden', 3.14322, 101.6846, 'ordinary', 'approved', '0000003a-4a20-4000-8000-000000000000'::uuid, 'plant-0000003a'),
  (59, 'Syzygium aromaticum', 'Clove', 'Cengkih', 'Myrtaceae', 'Syzygium', 'Aromatic evergreen; the spice is the dried flower bud.', 'Least Concern', 'Native to Maluku, planted widely', 'Humid hills and spice gardens.', 'Historic spice of the Malay archipelago.', 'Cengkih', 'flowering', 17.6, 49.5, 'broad', 'flowers', 'healthy', 'Field note 059. Habit: tree. Crown and stem match a flowering healthy plant on the Perdana Lake edge plot.', 'Perdana Lake edge', 3.14174, 101.68728, 'ordinary', 'approved', '0000003b-4a20-4000-8000-000000000000'::uuid, 'plant-0000003b'),
  (60, 'Psidium guajava', 'Guava', 'Jambu batu', 'Myrtaceae', 'Psidium', 'Peeling bark and gritty sweet fruit.', 'Least Concern', 'Planted throughout the tropics', 'Gardens, waste ground and orchards.', 'Fruit is eaten fresh and as juice.', 'Jambu batu', 'fruiting', 17.0, 46.0, 'broad', 'fruit', 'healthy', 'Field note 060. Habit: tree. Crown and stem match a fruiting healthy plant on the Bukit Nanas Forest Reserve plot.', 'Bukit Nanas Forest Reserve', 3.15096, 101.70272, 'ordinary', 'approved', '0000003c-4a20-4000-8000-000000000000'::uuid, 'plant-0000003c'),
  (61, 'Rhodomyrtus tomentosa', 'Rose myrtle', 'Kemunting', 'Myrtaceae', 'Rhodomyrtus', 'Downy shrub with pink flowers and purple berries.', 'Least Concern', 'South and Southeast Asia', 'Open sandy ground and roadsides.', 'Berries are eaten and made into jam.', 'Kemunting', 'mature', 2.35, 6.4, 'broad', 'none', 'healthy', 'Field note 061. Habit: shrub. Crown and stem match a mature healthy plant on the KLCC Park plot.', 'KLCC Park', 3.15378, 101.7124, 'ordinary', 'approved', '0000003d-4a20-4000-8000-000000000000'::uuid, 'plant-0000003d'),
  (62, 'Melaleuca cajuputi', 'Cajuput', 'Gelam', 'Myrtaceae', 'Melaleuca', 'Papery bark and narrow grey-green leaves.', 'Least Concern', 'Peninsular Malaysia to Australia', 'Seasonal swamps and coasts.', 'Leaves yield cajuput oil.', 'Gelam', 'fruiting', 17.8, 51.0, 'broad', 'fruit', 'healthy', 'Field note 062. Habit: tree. Crown and stem match a fruiting healthy plant on the Taman Tugu plot.', 'Taman Tugu', 3.1526, 101.68338, 'ordinary', 'approved', '0000003e-4a20-4000-8000-000000000000'::uuid, 'plant-0000003e'),
  (63, 'Cinnamomum iners', 'Wild cinnamon', 'Medang teja', 'Lauraceae', 'Cinnamomum', 'Evergreen with three-veined leaves that smell of cinnamon when crushed.', 'Least Concern', 'Southeast Asia', 'Secondary forest and parks.', 'Shade tree; a wild relative of cinnamon.', 'Medang teja', 'flowering', 17.2, 49.5, 'broad', 'flowers', 'fair', 'Field note 063. Habit: tree. Crown and stem match a flowering fair plant on the Rimba Ilmu plot.', 'Rimba Ilmu, Universiti Malaya', 3.13122, 101.65592, 'ordinary', 'approved', '0000003f-4a20-4000-8000-000000000000'::uuid, 'plant-0000003f'),
  (64, 'Cinnamomum verum', 'Cinnamon', 'Kayu manis', 'Lauraceae', 'Cinnamomum', 'Small tree whose inner bark is the spice.', 'Least Concern', 'Planted in tropical Asia', 'Spice gardens.', 'Bark and leaves are culinary spices.', 'Kayu manis', 'seedling', 2.4, 3.0, 'broad', 'none', 'healthy', 'Field note 064. Habit: tree. Crown and stem match a seedling healthy plant on the Bukit Gasing forest plot.', 'Bukit Gasing forest', 3.09604, 101.6584, 'ordinary', 'approved', '00000040-4a20-4000-8000-000000000000'::uuid, 'plant-00000040'),
  (65, 'Litsea garciae', 'Engkala', 'Engkala', 'Lauraceae', 'Litsea', 'Forest tree with flat round fruit eaten with salt.', 'Least Concern', 'Borneo and the southern Philippines', 'Lowland forest.', 'A Bornean fruit, eaten raw with a little salt.', 'Engkala', 'sapling', 4.5, 16.5, 'broad', 'none', 'healthy', 'Field note 065. Habit: tree. Crown and stem match a sapling healthy plant on the Kota Damansara Community Forest plot.', 'Kota Damansara Community Forest', 3.16756, 101.58308, 'ordinary', 'approved', '00000041-4a20-4000-8000-000000000000'::uuid, 'plant-00000041'),
  (66, 'Persea americana', 'Avocado', 'Avokado', 'Lauraceae', 'Persea', 'Glossy leaves and pear-shaped oily fruit.', 'Least Concern', 'Planted throughout the tropics', 'Highland and lowland gardens.', 'Fruit is eaten fresh.', 'Avokado', 'mature', 18.4, 53.0, 'broad', 'none', 'healthy', 'Field note 066. Habit: tree. Crown and stem match a mature healthy plant on the Taman Botani Negara Shah Alam plot.', 'Taman Botani Negara Shah Alam', 3.09818, 101.50632, 'ordinary', 'approved', '00000042-4a20-4000-8000-000000000000'::uuid, 'plant-00000042'),
  (67, 'Aquilaria malaccensis', 'Agarwood', 'Gaharu', 'Thymelaeaceae', 'Aquilaria', 'Plain-looking tree that forms dark fragrant resin in wounded wood.', 'Critically Endangered', 'Northeast India to Malesia', 'Lowland forest; wild trees are heavily poached.', 'Resin is incense and perfume. This record is rare.', 'Gaharu', 'flowering', 16.8, 49.5, 'broad', 'flowers', 'healthy', 'Field note 067. Habit: tree. Crown and stem match a flowering healthy plant on the Putrajaya Botanical Garden plot.', 'Putrajaya Botanical Garden', 2.9448, 101.6994, 'rare', 'approved', '00000043-4a20-4000-8000-000000000000'::uuid, 'plant-00000043'),
  (68, 'Gonystylus bancanus', 'Ramin', 'Ramin', 'Thymelaeaceae', 'Gonystylus', 'Straight peat-swamp tree with pale timber.', 'Critically Endangered', 'Peat swamps of Malaysia, Sumatra and Borneo', 'Peat swamp forest, now widely cleared.', 'CITES-listed timber. Kept off the public page.', 'Ramin', 'fruiting', 18.2, 46.0, 'broad', 'fruit', 'poor', 'Field note 068. Habit: tree. Crown and stem match a fruiting poor plant on the Penang Botanic Gardens plot.', 'Penang Botanic Gardens', 5.43802, 100.29168, 'rare', 'approved', '00000044-4a20-4000-8000-000000000000'::uuid, 'plant-00000044'),
  (69, 'Eusideroxylon zwageri', 'Borneo ironwood', 'Belian', 'Lauraceae', 'Eusideroxylon', 'Extremely hard, heavy wood that resists rot and termites.', 'Vulnerable', 'Borneo and Sumatra', 'Lowland forest on well-drained ground.', 'Traditional posts and shingles. Large trees are scarce.', 'Belian', 'mature', 19.6, 50.5, 'broad', 'none', 'healthy', 'Field note 069. Habit: tree. Crown and stem match a mature healthy plant on the Kuala Selangor Nature Park plot.', 'Kuala Selangor Nature Park', 3.34024, 101.24532, 'rare', 'approved', '00000045-4a20-4000-8000-000000000000'::uuid, 'plant-00000045'),
  (70, 'Palaquium gutta', 'Gutta-percha', 'Nyatoh taban', 'Sapotaceae', 'Palaquium', 'Forest tree whose latex was the original gutta-percha.', 'Near Threatened', 'Peninsular Malaysia, Sumatra and Borneo', 'Lowland forest.', 'Latex once insulated submarine cables.', 'Nyatoh taban', 'fruiting', 17.0, 51.0, 'broad', 'fruit', 'fair', 'Field note 070. Habit: tree. Crown and stem match a fruiting fair plant on the FRIM canopy walk plot.', 'FRIM canopy walk, Kepong', 3.23706, 101.6328, 'ordinary', 'approved', '00000046-4a20-4000-8000-000000000000'::uuid, 'plant-00000046'),
  (71, 'Dyera costulata', 'Jelutong', 'Jelutong', 'Apocynaceae', 'Dyera', 'Huge tree with white latex and a columnar trunk.', 'Least Concern', 'Peninsular Malaysia, Sumatra and Borneo', 'Lowland forest.', 'Light timber for carving; latex was chewing gum.', 'Jelutong', 'flowering', 16.4, 49.5, 'broad', 'flowers', 'healthy', 'Field note 071. Habit: tree. Crown and stem match a flowering healthy plant on the FRIM Rover track plot.', 'FRIM Rover track, Kepong', 3.23398, 101.63668, 'ordinary', 'approved', '00000047-4a20-4000-8000-000000000000'::uuid, 'plant-00000047'),
  (72, 'Alstonia angustiloba', 'Pulai', 'Pulai', 'Apocynaceae', 'Alstonia', 'Tall tree with leaves in whorls and bitter white latex.', 'Least Concern', 'Thailand to Malesia', 'Secondary forest and open country.', 'Light timber and traditional medicine.', 'Pulai', 'seedling', 1.6, 3.0, 'broad', 'none', 'healthy', 'Field note 072. Habit: tree. Crown and stem match a seedling healthy plant on the Perdana Botanical Garden plot.', 'Perdana Botanical Garden', 3.1428, 101.68412, 'ordinary', 'approved', '00000048-4a20-4000-8000-000000000000'::uuid, 'plant-00000048'),
  (73, 'Plumeria rubra', 'Frangipani', 'Kemboja', 'Apocynaceae', 'Plumeria', 'Thick branches, fragrant flowers, and milky sap.', 'Least Concern', 'Planted throughout the tropics', 'Gardens, cemeteries and temples.', 'Ornamental. Sap can irritate skin.', 'Kemboja', 'sapling', 5.7, 16.5, 'broad', 'none', 'healthy', 'Field note 073. Habit: tree. Crown and stem match a sapling healthy plant on the Perdana Lake edge plot.', 'Perdana Lake edge', 3.14132, 101.6868, 'ordinary', 'approved', '00000049-4a20-4000-8000-000000000000'::uuid, 'plant-00000049'),
  (74, 'Cerbera odollam', 'Pong pong', 'Pong pong', 'Apocynaceae', 'Cerbera', 'Coastal tree with white flowers and large round fruit.', 'Least Concern', 'Coasts of South and Southeast Asia', 'Mangrove edges and sandy shores.', 'All parts are poisonous. Fruit is not eaten.', 'Pong pong', 'mature', 19.6, 53.0, 'broad', 'none', 'healthy', 'Field note 074. Habit: tree. Crown and stem match a mature healthy plant on the Bukit Nanas Forest Reserve plot.', 'Bukit Nanas Forest Reserve', 3.15264, 101.70368, 'ordinary', 'approved', '0000004a-4a20-4000-8000-000000000000'::uuid, 'plant-0000004a'),
  (75, 'Allamanda cathartica', 'Golden trumpet', 'Alamanda', 'Apocynaceae', 'Allamanda', 'Scrambling shrub with large yellow trumpet flowers.', 'Least Concern', 'Planted throughout the tropics', 'Sunny hedges.', 'Ornamental. Sap is irritating.', 'Alamanda', 'flowering', 1.8, 6.2, 'broad', 'flowers', 'healthy', 'Field note 075. Habit: shrub. Crown and stem match a flowering healthy plant on the KLCC Park plot.', 'KLCC Park', 3.15336, 101.71192, 'ordinary', 'approved', '0000004b-4a20-4000-8000-000000000000'::uuid, 'plant-0000004b'),
  (76, 'Catharanthus roseus', 'Madagascar periwinkle', 'Kemunting cina', 'Apocynaceae', 'Catharanthus', 'Low shrub with pink or white pinwheel flowers.', 'Least Concern', 'Planted throughout the tropics', 'Gardens and dry waste ground.', 'Ornamental. Wild relatives supplied medicines for leukaemia research.', 'Kemunting cina', 'fruiting', 2.15, 5.0, 'broad', 'fruit', 'healthy', 'Field note 076. Habit: shrub. Crown and stem match a fruiting healthy plant on the Taman Tugu plot.', 'Taman Tugu', 3.15218, 101.6829, 'ordinary', 'approved', '0000004c-4a20-4000-8000-000000000000'::uuid, 'plant-0000004c'),
  (77, 'Cananga odorata', 'Ylang-ylang', 'Kenanga', 'Annonaceae', 'Cananga', 'Drooping fragrant green-yellow flowers.', 'Least Concern', 'Southeast Asia to Australia', 'Villages and forest edges.', 'Flowers for perfume and garlands.', 'Kenanga', 'mature', 18.8, 50.5, 'broad', 'none', 'fair', 'Field note 077. Habit: tree. Crown and stem match a mature fair plant on the Rimba Ilmu plot.', 'Rimba Ilmu, Universiti Malaya', 3.1308, 101.65688, 'ordinary', 'approved', '0000004d-4a20-4000-8000-000000000000'::uuid, 'plant-0000004d'),
  (78, 'Annona muricata', 'Soursop', 'Durian belanda', 'Annonaceae', 'Annona', 'Large spiny green fruit and glossy leaves.', 'Least Concern', 'Planted throughout the tropics', 'Home gardens.', 'Pulp is eaten and juiced.', 'Durian belanda', 'fruiting', 18.2, 51.0, 'broad', 'fruit', 'healthy', 'Field note 078. Habit: tree. Crown and stem match a fruiting healthy plant on the Bukit Gasing forest plot.', 'Bukit Gasing forest', 3.09562, 101.65792, 'ordinary', 'approved', '0000004e-4a20-4000-8000-000000000000'::uuid, 'plant-0000004e'),
  (79, 'Annona squamosa', 'Sugar apple', 'Nona', 'Annonaceae', 'Annona', 'Knobbly fruit that splits into sweet segments.', 'Least Concern', 'Planted throughout the tropics', 'Gardens in a monsoon climate.', 'Dessert fruit.', 'Nona', 'flowering', 17.6, 49.5, 'broad', 'flowers', 'healthy', 'Field note 079. Habit: tree. Crown and stem match a flowering healthy plant on the Kota Damansara Community Forest plot.', 'Kota Damansara Community Forest', 3.16924, 101.5826, 'ordinary', 'approved', '0000004f-4a20-4000-8000-000000000000'::uuid, 'plant-0000004f'),
  (80, 'Polyalthia longifolia', 'Mast tree', 'Asoka', 'Annonaceae', 'Polyalthia', 'Very narrow upright crown, often planted in a row.', 'Least Concern', 'South and Southeast Asia', 'Roadsides and compounds.', 'Screen and avenue tree.', 'Asoka', 'seedling', 0.8, 3.0, 'broad', 'none', 'healthy', 'Field note 080. Habit: tree. Crown and stem match a seedling healthy plant on the Taman Botani Negara Shah Alam plot.', 'Taman Botani Negara Shah Alam', 3.09776, 101.50728, 'ordinary', 'approved', '00000050-4a20-4000-8000-000000000000'::uuid, 'plant-00000050'),
  (81, 'Canarium odontophyllum', 'Dabai', 'Dabai', 'Burseraceae', 'Canarium', 'Forest tree with dark purple olives that are blanched before eating.', 'Least Concern', 'Borneo', 'Lowland forest and longhouses.', 'A signature Sarawak fruit.', 'Dabai', 'sapling', 4.9, 16.5, 'compound', 'none', 'healthy', 'Field note 081. Habit: tree. Crown and stem match a sapling healthy plant on the Putrajaya Botanical Garden plot.', 'Putrajaya Botanical Garden', 2.94438, 101.69892, 'ordinary', 'approved', '00000051-4a20-4000-8000-000000000000'::uuid, 'plant-00000051'),
  (82, 'Sandoricum koetjape', 'Santol', 'Sentul', 'Meliaceae', 'Sandoricum', 'Round sour fruit and a flaky pale bark.', 'Least Concern', 'Cultivated across Southeast Asia', 'Villages and old orchards.', 'Fruit is eaten with sugar or cooked.', 'Sentul', 'mature', 18.8, 53.0, 'compound', 'none', 'healthy', 'Field note 082. Habit: tree. Crown and stem match a mature healthy plant on the Penang Botanic Gardens plot.', 'Penang Botanic Gardens', 5.4376, 100.2912, 'ordinary', 'approved', '00000052-4a20-4000-8000-000000000000'::uuid, 'plant-00000052'),
  (83, 'Swietenia macrophylla', 'Big-leaf mahogany', 'Mahogani', 'Meliaceae', 'Swietenia', 'Large leaflets and a heavy winged fruit.', 'Vulnerable', 'Planted widely; native to tropical America', 'Plantations and roadsides in Malaysia.', 'Cabinet timber. Wild populations are reduced.', 'Mahogani', 'flowering', 17.2, 49.5, 'compound', 'flowers', 'healthy', 'Field note 083. Habit: tree. Crown and stem match a flowering healthy plant on the Kuala Selangor Nature Park plot.', 'Kuala Selangor Nature Park', 3.33982, 101.24628, 'ordinary', 'approved', '00000053-4a20-4000-8000-000000000000'::uuid, 'plant-00000053'),
  (84, 'Azadirachta indica', 'Neem', 'Mambu', 'Meliaceae', 'Azadirachta', 'Bitter leaves and olive-like fruit.', 'Least Concern', 'South and Southeast Asia', 'Dry open ground and towns.', 'Traditional insecticide and medicine.', 'Mambu', 'fruiting', 18.6, 46.0, 'compound', 'fruit', 'fair', 'Field note 084. Habit: tree. Crown and stem match a fruiting fair plant on the FRIM canopy walk plot.', 'FRIM canopy walk, Kepong', 3.23874, 101.63232, 'ordinary', 'approved', '00000054-4a20-4000-8000-000000000000'::uuid, 'plant-00000054'),
  (85, 'Lagerstroemia speciosa', 'Pride of India', 'Bungor', 'Lythraceae', 'Lagerstroemia', 'Showy pink-purple flowers and peeling bark.', 'Least Concern', 'South and Southeast Asia', 'Riversides and parks.', 'A favourite ornamental tree.', 'Bungor', 'mature', 18.0, 50.5, 'broad', 'none', 'poor', 'Field note 085. Habit: tree. Crown and stem match a mature poor plant on the FRIM Rover track plot.', 'FRIM Rover track, Kepong', 3.23356, 101.6362, 'ordinary', 'approved', '00000055-4a20-4000-8000-000000000000'::uuid, 'plant-00000055'),
  (86, 'Terminalia catappa', 'Sea almond', 'Ketapang', 'Combretaceae', 'Terminalia', 'Tiered branches and leaves that turn red before falling.', 'Least Concern', 'Tropical Asian coasts', 'Beaches and town greens.', 'Shade tree; the kernel is edible.', 'Ketapang', 'fruiting', 17.4, 51.0, 'broad', 'fruit', 'healthy', 'Field note 086. Habit: tree. Crown and stem match a fruiting healthy plant on the Perdana Botanical Garden plot.', 'Perdana Botanical Garden', 3.14238, 101.68508, 'ordinary', 'approved', '00000056-4a20-4000-8000-000000000000'::uuid, 'plant-00000056'),
  (87, 'Hibiscus rosa-sinensis', 'Chinese hibiscus', 'Bunga raya', 'Malvaceae', 'Hibiscus', 'Glossy shrub with large red flowers.', 'Least Concern', 'Planted throughout the tropics', 'Hedges and gardens.', 'National flower of Malaysia.', 'Bunga raya', 'flowering', 2.1, 6.2, 'broad', 'flowers', 'healthy', 'Field note 087. Habit: shrub. Crown and stem match a flowering healthy plant on the Perdana Lake edge plot.', 'Perdana Lake edge', 3.1409, 101.68632, 'ordinary', 'approved', '00000057-4a20-4000-8000-000000000000'::uuid, 'plant-00000057'),
  (88, 'Hibiscus tiliaceus', 'Sea hibiscus', 'Bebaru', 'Malvaceae', 'Hibiscus', 'Crooked coastal tree with heart-shaped leaves and yellow flowers.', 'Least Concern', 'Tropical coasts', 'Behind beaches and mangrove edges.', 'Bark fibre for cordage; a shore stabiliser.', 'Bebaru', 'seedling', 2.0, 3.0, 'broad', 'none', 'healthy', 'Field note 088. Habit: tree. Crown and stem match a seedling healthy plant on the Bukit Nanas Forest Reserve plot.', 'Bukit Nanas Forest Reserve', 3.15222, 101.7032, 'ordinary', 'approved', '00000058-4a20-4000-8000-000000000000'::uuid, 'plant-00000058'),
  (89, 'Theobroma cacao', 'Cacao', 'Koko', 'Malvaceae', 'Theobroma', 'Small understorey tree with pods on the trunk.', 'Least Concern', 'Planted in humid tropics', 'Shade gardens.', 'Seeds are the source of cocoa.', 'Koko', 'sapling', 6.1, 16.5, 'broad', 'none', 'healthy', 'Field note 089. Habit: tree. Crown and stem match a sapling healthy plant on the KLCC Park plot.', 'KLCC Park', 3.15504, 101.71288, 'ordinary', 'approved', '00000059-4a20-4000-8000-000000000000'::uuid, 'plant-00000059'),
  (90, 'Ceiba pentandra', 'Kapok', 'Kekabu', 'Malvaceae', 'Ceiba', 'Huge trunk with spines when young and silky fibre in the pods.', 'Least Concern', 'Tropics worldwide', 'Open country and villages.', 'Floss was used as stuffing.', 'Kekabu', 'mature', 18.0, 53.0, 'broad', 'none', 'healthy', 'Field note 090. Habit: tree. Crown and stem match a mature healthy plant on the Taman Tugu plot.', 'Taman Tugu', 3.15176, 101.68242, 'ordinary', 'approved', '0000005a-4a20-4000-8000-000000000000'::uuid, 'plant-0000005a'),
  (91, 'Cocos nucifera', 'Coconut', 'Kelapa', 'Arecaceae', 'Cocos', 'Tall palm with a crown of fronds and large nuts.', 'Least Concern', 'Tropical coasts worldwide', 'Shores, villages and plantations.', 'Drink, oil, fibre and thatch.', 'Kelapa', 'flowering', 9.4, 37.5, 'compound', 'flowers', 'fair', 'Field note 091. Habit: palm. Crown and stem match a flowering fair plant on the Rimba Ilmu plot.', 'Rimba Ilmu, Universiti Malaya', 3.13038, 101.6564, 'ordinary', 'approved', '0000005b-4a20-4000-8000-000000000000'::uuid, 'plant-0000005b'),
  (92, 'Areca catechu', 'Betel palm', 'Pinang', 'Arecaceae', 'Areca', 'Slender palm with orange nuts.', 'Least Concern', 'Planted across tropical Asia', 'House yards.', 'The nut is the betel chew, with sirih leaf.', 'Pinang', 'fruiting', 11.8, 34.0, 'compound', 'fruit', 'healthy', 'Field note 092. Habit: palm. Crown and stem match a fruiting healthy plant on the Bukit Gasing forest plot.', 'Bukit Gasing forest', 3.0952, 101.65888, 'ordinary', 'approved', '0000005c-4a20-4000-8000-000000000000'::uuid, 'plant-0000005c'),
  (93, 'Elaeis guineensis', 'Oil palm', 'Kelapa sawit', 'Arecaceae', 'Elaeis', 'Stout palm with heavy bunches of oily fruit.', 'Least Concern', 'Planted across Malaysia and Indonesia', 'Plantations.', 'The main vegetable-oil crop of the region.', 'Kelapa sawit', 'mature', 11.2, 34.5, 'compound', 'none', 'healthy', 'Field note 093. Habit: palm. Crown and stem match a mature healthy plant on the Kota Damansara Community Forest plot.', 'Kota Damansara Community Forest', 3.16882, 101.58212, 'ordinary', 'approved', '0000005d-4a20-4000-8000-000000000000'::uuid, 'plant-0000005d'),
  (94, 'Cyrtostachys renda', 'Lipstick palm', 'Pinang raja', 'Arecaceae', 'Cyrtostachys', 'Clump palm with a scarlet crownshaft.', 'Least Concern', 'Southern Thailand, Peninsular Malaysia, Sumatra and Borneo', 'Freshwater swamps.', 'A famous ornamental, native to peat and freshwater swamp.', 'Pinang raja', 'fruiting', 12.6, 39.0, 'compound', 'fruit', 'healthy', 'Field note 094. Habit: palm. Crown and stem match a fruiting healthy plant on the Taman Botani Negara Shah Alam plot.', 'Taman Botani Negara Shah Alam', 3.09944, 101.5068, 'ordinary', 'approved', '0000005e-4a20-4000-8000-000000000000'::uuid, 'plant-0000005e'),
  (95, 'Roystonea regia', 'Royal palm', 'Palma diraja', 'Arecaceae', 'Roystonea', 'Tall grey trunk with a smooth green crownshaft.', 'Least Concern', 'Planted throughout the tropics', 'Avenues and civic parks.', 'Formal ornamental palm.', 'Palma diraja', 'flowering', 9.0, 37.5, 'compound', 'flowers', 'healthy', 'Field note 095. Habit: palm. Crown and stem match a flowering healthy plant on the Putrajaya Botanical Garden plot.', 'Putrajaya Botanical Garden', 2.94396, 101.69988, 'ordinary', 'approved', '0000005f-4a20-4000-8000-000000000000'::uuid, 'plant-0000005f'),
  (96, 'Arenga pinnata', 'Sugar palm', 'Kabung', 'Arecaceae', 'Arenga', 'Black fibre on the trunk and large drooping fronds.', 'Least Concern', 'Southeast Asia', 'Forest edges and villages.', 'Sap is boiled into palm sugar.', 'Kabung', 'seedling', 1.0, 4.0, 'compound', 'none', 'healthy', 'Field note 096. Habit: palm. Crown and stem match a seedling healthy plant on the Penang Botanic Gardens plot.', 'Penang Botanic Gardens', 5.43718, 100.29072, 'ordinary', 'approved', '00000060-4a20-4000-8000-000000000000'::uuid, 'plant-00000060'),
  (97, 'Oncosperma tigillarium', 'Nibung', 'Nibung', 'Arecaceae', 'Oncosperma', 'Spiny clustering palm of tidal ground.', 'Least Concern', 'Coasts of Southeast Asia', 'Landward mangrove and tidal rivers.', 'Trunks were used as piles. A symbol on the Indonesian coat of arms.', 'Nibung', 'sapling', 3.3, 14.5, 'compound', 'none', 'healthy', 'Field note 097. Habit: palm. Crown and stem match a sapling healthy plant on the Kuala Selangor Nature Park plot.', 'Kuala Selangor Nature Park', 3.3394, 101.2458, 'ordinary', 'approved', '00000061-4a20-4000-8000-000000000000'::uuid, 'plant-00000061'),
  (98, 'Nypa fruticans', 'Nipa', 'Nipah', 'Arecaceae', 'Nypa', 'Trunkless palm forming pure stands in brackish water.', 'Least Concern', 'Tropical Asian estuaries', 'Estuaries and tidal creeks.', 'Leaves for thatch; sap for sugar.', 'Nipah', 'mature', 11.2, 37.0, 'compound', 'none', 'fair', 'Field note 098. Habit: palm. Crown and stem match a mature fair plant on the FRIM canopy walk plot.', 'FRIM canopy walk, Kepong', 3.23832, 101.63328, 'ordinary', 'approved', '00000062-4a20-4000-8000-000000000000'::uuid, 'plant-00000062'),
  (99, 'Salacca zalacca', 'Salak', 'Salak', 'Arecaceae', 'Salacca', 'Spiny undergrowth palm with scaly brown fruit.', 'Least Concern', 'Cultivated in Indonesia and Malaysia', 'Shaded gardens.', 'Fruit is eaten fresh.', 'Salak', 'flowering', 10.6, 37.5, 'compound', 'flowers', 'healthy', 'Field note 099. Habit: palm. Crown and stem match a flowering healthy plant on the FRIM Rover track plot.', 'FRIM Rover track, Kepong', 3.23524, 101.63572, 'ordinary', 'approved', '00000063-4a20-4000-8000-000000000000'::uuid, 'plant-00000063'),
  (100, 'Livistona chinensis', 'Chinese fan palm', 'Palma kipas', 'Arecaceae', 'Livistona', 'Fan leaves with drooping tips.', 'Least Concern', 'Planted throughout the tropics', 'Parks and courtyards.', 'Ornamental palm.', 'Palma kipas', 'fruiting', 11.0, 34.0, 'compound', 'fruit', 'healthy', 'Field note 100. Habit: palm. Crown and stem match a fruiting healthy plant on the Perdana Botanical Garden plot.', 'Perdana Botanical Garden', 3.14196, 101.6846, 'ordinary', 'approved', '00000064-4a20-4000-8000-000000000000'::uuid, 'plant-00000064'),
  (101, 'Licuala grandis', 'Ruffled fan palm', 'Palas payung', 'Arecaceae', 'Licuala', 'Round pleated leaves on a short trunk.', 'Least Concern', 'Vanuatu, planted widely', 'Shady gardens.', 'Understorey ornamental.', 'Palas payung', 'mature', 10.4, 34.5, 'compound', 'none', 'healthy', 'Field note 101. Habit: palm. Crown and stem match a mature healthy plant on the Perdana Lake edge plot.', 'Perdana Lake edge', 3.14048, 101.68728, 'ordinary', 'approved', '00000065-4a20-4000-8000-000000000000'::uuid, 'plant-00000065'),
  (102, 'Calamus manan', 'Manau rattan', 'Rotan manau', 'Arecaceae', 'Calamus', 'Large climbing palm with a long cane.', 'Vulnerable', 'Peninsular Malaysia, Sumatra and Borneo', 'Lowland forest, climbing into the canopy.', 'The best furniture rattan. Wild stocks are depleted.', 'Rotan manau', 'fruiting', 6.8, 4.8, 'compound', 'fruit', 'poor', 'Field note 102. Habit: climber. Crown and stem match a fruiting poor plant on the Bukit Nanas Forest Reserve plot.', 'Bukit Nanas Forest Reserve', 3.1518, 101.70272, 'rare', 'approved', '00000066-4a20-4000-8000-000000000000'::uuid, 'plant-00000066'),
  (103, 'Musa acuminata', 'Wild banana', 'Pisang', 'Musaceae', 'Musa', 'Large herb with a soft false stem and hanging fruit.', 'Least Concern', 'Southeast Asia', 'Forest gaps and villages.', 'Ancestor of many dessert bananas.', 'Pisang', 'flowering', 2.25, 9.2, 'broad', 'flowers', 'healthy', 'Field note 103. Habit: herb. Crown and stem match a flowering healthy plant on the KLCC Park plot.', 'KLCC Park', 3.15462, 101.7124, 'ordinary', 'approved', '00000067-4a20-4000-8000-000000000000'::uuid, 'plant-00000067'),
  (104, 'Etlingera elatior', 'Torch ginger', 'Bunga kantan', 'Zingiberaceae', 'Etlingera', 'Tall ginger with a pink torch flower.', 'Least Concern', 'Peninsular Malaysia, Sumatra and Borneo', 'Damp forest edges and gardens.', 'Flower buds flavour laksa and kerabu.', 'Bunga kantan', 'seedling', 0.9, 2.0, 'broad', 'none', 'healthy', 'Field note 104. Habit: herb. Crown and stem match a seedling healthy plant on the Taman Tugu plot.', 'Taman Tugu', 3.15344, 101.68338, 'ordinary', 'approved', '00000068-4a20-4000-8000-000000000000'::uuid, 'plant-00000068'),
  (105, 'Bambusa vulgaris', 'Common bamboo', 'Buluh kuning', 'Poaceae', 'Bambusa', 'Clumped culms, often yellow with green stripes.', 'Least Concern', 'Planted throughout the tropics', 'Riversides and villages.', 'Poles, crafts and living fences.', 'Buluh kuning', 'sapling', 4.0, 8.5, 'narrow', 'none', 'fair', 'Field note 105. Habit: bamboo. Crown and stem match a sapling fair plant on the Rimba Ilmu plot.', 'Rimba Ilmu, Universiti Malaya', 3.12996, 101.65592, 'ordinary', 'approved', '00000069-4a20-4000-8000-000000000000'::uuid, 'plant-00000069'),
  (106, 'Dendrocalamus asper', 'Giant bamboo', 'Buluh betung', 'Poaceae', 'Dendrocalamus', 'Very large culms with thick walls.', 'Least Concern', 'Southeast Asia', 'Lowland gardens and forest edges.', 'Construction and bamboo shoots.', 'Buluh betung', 'mature', 14.4, 17.0, 'narrow', 'none', 'healthy', 'Field note 106. Habit: bamboo. Crown and stem match a mature healthy plant on the Bukit Gasing forest plot.', 'Bukit Gasing forest', 3.09478, 101.6584, 'ordinary', 'approved', '0000006a-4a20-4000-8000-000000000000'::uuid, 'plant-0000006a'),
  (107, 'Gigantochloa scortechinii', 'Semantan bamboo', 'Buluh semantan', 'Poaceae', 'Gigantochloa', 'Native clump bamboo of forest edges.', 'Least Concern', 'Peninsular Malaysia', 'Hill forest margins.', 'A main local source of bamboo poles.', 'Buluh semantan', 'flowering', 12.8, 17.5, 'narrow', 'flowers', 'healthy', 'Field note 107. Habit: bamboo. Crown and stem match a flowering healthy plant on the Kota Damansara Community Forest plot.', 'Kota Damansara Community Forest', 3.1684, 101.58308, 'ordinary', 'approved', '0000006b-4a20-4000-8000-000000000000'::uuid, 'plant-0000006b'),
  (108, 'Dendrobium crumenatum', 'Pigeon orchid', 'Anggerek merpati', 'Orchidaceae', 'Dendrobium', 'Epiphyte that flowers in a burst after a temperature drop.', 'Least Concern', 'Southeast Asia', 'On roadside trees and in open forest.', 'A familiar wild orchid in towns.', 'Anggerek merpati', 'fruiting', 0.95, 2.0, 'broad', 'fruit', 'healthy', 'Field note 108. Habit: orchid. Crown and stem match a fruiting healthy plant on the Taman Botani Negara Shah Alam plot.', 'Taman Botani Negara Shah Alam', 3.09902, 101.50632, 'ordinary', 'approved', '0000006c-4a20-4000-8000-000000000000'::uuid, 'plant-0000006c'),
  (109, 'Grammatophyllum speciosum', 'Tiger orchid', 'Anggerek harimau', 'Orchidaceae', 'Grammatophyllum', 'The largest orchid, with long canes and spotted flowers.', 'Least Concern', 'Southeast Asia', 'Low on big trees in humid forest.', 'Protected in many gardens. This clump is marked rare.', 'Anggerek harimau', 'mature', 1.2, 2.4, 'broad', 'none', 'healthy', 'Field note 109. Habit: orchid. Crown and stem match a mature healthy plant on the Putrajaya Botanical Garden plot.', 'Putrajaya Botanical Garden', 2.94564, 101.6994, 'rare', 'approved', '0000006d-4a20-4000-8000-000000000000'::uuid, 'plant-0000006d'),
  (110, 'Phalaenopsis amabilis', 'Moon orchid', 'Anggerek bulan', 'Orchidaceae', 'Phalaenopsis', 'Epiphyte with broad leaves and white moth-like flowers.', 'Least Concern', 'Malesia to Australia', 'Humid lowland forest.', 'Parent of many cultivated moth orchids.', 'Anggerek bulan', 'fruiting', 0.5, 2.8, 'broad', 'fruit', 'healthy', 'Field note 110. Habit: orchid. Crown and stem match a fruiting healthy plant on the Penang Botanic Gardens plot.', 'Penang Botanic Gardens', 5.43676, 100.29168, 'ordinary', 'approved', '0000006e-4a20-4000-8000-000000000000'::uuid, 'plant-0000006e'),
  (111, 'Vanda dearei', 'Borneo vanda', 'Vanda Borneo', 'Orchidaceae', 'Vanda', 'Large epiphyte with rounded tawny flowers.', 'Vulnerable', 'Borneo', 'Lowland forest on tall trees.', 'Collected for the trade. Marked rare.', 'Vanda Borneo', 'flowering', 0.95, 3.2, 'broad', 'flowers', 'healthy', 'Field note 111. Habit: orchid. Crown and stem match a flowering healthy plant on the Kuala Selangor Nature Park plot.', 'Kuala Selangor Nature Park', 3.33898, 101.24532, 'rare', 'approved', '0000006f-4a20-4000-8000-000000000000'::uuid, 'plant-0000006f'),
  (112, 'Nepenthes rafflesiana', 'Raffles pitcher plant', 'Periuk kera', 'Nepenthaceae', 'Nepenthes', 'Climbing plant with lower and upper pitchers.', 'Least Concern', 'Peninsular Malaysia and Borneo', 'Kerangas and open sandy forest.', 'A well-known pitcher plant. This site is marked rare.', 'Periuk kera', 'seedling', 1.2, 1.0, 'broad', 'none', 'fair', 'Field note 112. Habit: climber. Crown and stem match a seedling fair plant on the FRIM canopy walk plot.', 'FRIM canopy walk, Kepong', 3.2379, 101.6328, 'rare', 'approved', '00000070-4a20-4000-8000-000000000000'::uuid, 'plant-00000070'),
  (113, 'Rafflesia cantleyi', 'Rafflesia', 'Bunga pakma', 'Rafflesiaceae', 'Rafflesia', 'Parasite with no leaves; the flower is the only visible part.', 'Vulnerable', 'Peninsular Malaysia', 'Inside forest, on Tetrastigma vines.', 'A protected flower. The record stays off the public page.', 'Bunga pakma', 'sapling', 1.25, 4.4, 'broad', 'none', 'healthy', 'Field note 113. Habit: herb. Crown and stem match a sapling healthy plant on the FRIM Rover track plot.', 'FRIM Rover track, Kepong', 3.23482, 101.63668, 'rare', 'approved', '00000071-4a20-4000-8000-000000000000'::uuid, 'plant-00000071'),
  (114, 'Agathis borneensis', 'Borneo kauri', 'Damar minyak', 'Araucariaceae', 'Agathis', 'Conifer with a columnar trunk and resinous bark.', 'Endangered', 'Peninsular Malaysia, Sumatra and Borneo', 'Hill and lowland forest.', 'Damar resin and timber. Large trees are uncommon.', 'Damar minyak', 'mature', 19.6, 53.0, 'broad', 'none', 'healthy', 'Field note 114. Habit: tree. Crown and stem match a mature healthy plant on the Perdana Botanical Garden plot.', 'Perdana Botanical Garden', 3.14364, 101.68412, 'rare', 'approved', '00000072-4a20-4000-8000-000000000000'::uuid, 'plant-00000072'),
  (115, 'Casuarina equisetifolia', 'Beach she-oak', 'Rhu', 'Casuarinaceae', 'Casuarina', 'Whip-like twigs and a sound like wind in pines.', 'Least Concern', 'Tropical coasts from Asia to the Pacific', 'Sandy shores.', 'A shore windbreak. The Malay name is rhu.', 'Rhu', 'flowering', 16.0, 49.5, 'narrow', 'flowers', 'healthy', 'Field note 115. Habit: tree. Crown and stem match a flowering healthy plant on the Perdana Lake edge plot.', 'Perdana Lake edge', 3.14006, 101.6868, 'ordinary', 'approved', '00000073-4a20-4000-8000-000000000000'::uuid, 'plant-00000073'),
  (116, 'Dillenia suffruticosa', 'Simpoh air', 'Simpoh air', 'Dilleniaceae', 'Dillenia', 'Large yellow flowers and leaves used as plates.', 'Least Concern', 'Peninsular Malaysia, Sumatra and Borneo', 'Open ground, stream banks and forest edges.', 'Pioneer shrub. Leaves wrap food.', 'Simpoh air', 'fruiting', 2.15, 5.0, 'broad', 'fruit', 'healthy', 'Field note 116. Habit: shrub. Crown and stem match a fruiting healthy plant on the Bukit Nanas Forest Reserve plot.', 'Bukit Nanas Forest Reserve', 3.15138, 101.70368, 'ordinary', 'approved', '00000074-4a20-4000-8000-000000000000'::uuid, 'plant-00000074'),
  (117, 'Mesua ferrea', 'Ceylon ironwood', 'Penaga', 'Calophyllaceae', 'Mesua', 'Dense dark crown and hard timber, with white fragrant flowers.', 'Least Concern', 'South and Southeast Asia', 'Lowland forest and temple grounds.', 'Ornamental and a very hard wood.', 'Penaga', 'mature', 18.8, 50.5, 'broad', 'none', 'healthy', 'Field note 117. Habit: tree. Crown and stem match a mature healthy plant on the KLCC Park plot.', 'KLCC Park', 3.1542, 101.71192, 'ordinary', 'approved', '00000075-4a20-4000-8000-000000000000'::uuid, 'plant-00000075'),
  (118, 'Rhizophora apiculata', 'Tall-stilt mangrove', 'Bakau minyak', 'Rhizophoraceae', 'Rhizophora', 'Mangrove with stilt roots and pointed leaves.', 'Least Concern', 'Tropical Asian coasts', 'Seaward mangrove mud.', 'Poles and charcoal; a main mangrove species.', 'Bakau minyak', 'fruiting', 18.2, 51.0, 'broad', 'fruit', 'healthy', 'Field note 118. Habit: tree. Crown and stem match a fruiting healthy plant on the Taman Tugu plot.', 'Taman Tugu', 3.15302, 101.6829, 'ordinary', 'approved', '00000076-4a20-4000-8000-000000000000'::uuid, 'plant-00000076'),
  (119, 'Ixora coccinea', 'Jungle flame', 'Jejarum', 'Rubiaceae', 'Ixora', 'Compact shrub with tight heads of red flowers.', 'Least Concern', 'South and Southeast Asia', 'Hedges and forest edges.', 'A standard garden hedge plant.', 'Jejarum', 'flowering', 2.4, 6.2, 'broad', 'flowers', 'poor', 'Field note 119. Habit: shrub. Crown and stem match a flowering poor plant on the Rimba Ilmu plot.', 'Rimba Ilmu, Universiti Malaya', 3.13164, 101.65688, 'ordinary', 'approved', '00000077-4a20-4000-8000-000000000000'::uuid, 'plant-00000077'),
  (120, 'Citrus hystrix', 'Kaffir lime', 'Limau purut', 'Rutaceae', 'Citrus', 'Double leaves and knobbly aromatic fruit.', 'Least Concern', 'Cultivated across Southeast Asia', 'Home gardens.', 'Leaves and rind are kitchen spices.', 'Limau purut', 'seedling', 0.3, 1.0, 'compound', 'none', 'healthy', 'Field note 120. Habit: shrub. Crown and stem match a seedling healthy plant on the Bukit Gasing forest plot.', 'Bukit Gasing forest', 3.09436, 101.65792, 'ordinary', 'approved', '00000078-4a20-4000-8000-000000000000'::uuid, 'plant-00000078'),
  (121, 'Asplenium nidus', 'Bird''s nest fern', 'Paku sarang burung', 'Aspleniaceae', 'Asplenium', 'Epiphytic fern with a basket of undivided fronds.', 'Least Concern', 'Tropical Asia to the Pacific', 'On trees in humid forest and in towns.', 'The nest holds leaf litter and water.', 'Paku sarang burung', 'sapling', 0.55, 2.4, 'broad', 'none', 'healthy', 'Field note 121. Habit: fern. Crown and stem match a sapling healthy plant on the Kota Damansara Community Forest plot.', 'Kota Damansara Community Forest', 3.16798, 101.5826, 'ordinary', 'approved', '00000079-4a20-4000-8000-000000000000'::uuid, 'plant-00000079'),
  (122, 'Tectona grandis', 'Teak', 'Jati', 'Lamiaceae', 'Tectona', 'Large leaves and a tall trunk with durable golden-brown wood.', 'Endangered', 'South and Southeast Asia', 'Monsoon forest and plantations.', 'A leading furniture timber. Wild stands are reduced.', 'Jati', 'mature', 18.8, 53.0, 'broad', 'none', 'healthy', 'Field note 122. Habit: tree. Crown and stem match a mature healthy plant on the Taman Botani Negara Shah Alam plot.', 'Taman Botani Negara Shah Alam', 3.0986, 101.50728, 'ordinary', 'approved', '0000007a-4a20-4000-8000-000000000000'::uuid, 'plant-0000007a'),
  (123, 'Hevea brasiliensis', 'Rubber', 'Getah', 'Euphorbiaceae', 'Hevea', 'Smooth grey trunk tapped for white latex.', 'Least Concern', 'Planted across Malaysia', 'Plantations and smallholdings.', 'The source of natural rubber.', 'Getah', 'flowering', 17.2, 49.5, 'broad', 'flowers', 'healthy', 'Field note 123. Habit: tree. Crown and stem match a flowering healthy plant on the Putrajaya Botanical Garden plot.', 'Putrajaya Botanical Garden', 2.94522, 101.69892, 'ordinary', 'approved', '0000007b-4a20-4000-8000-000000000000'::uuid, 'plant-0000007b'),
  (124, 'Morinda citrifolia', 'Noni', 'Mengkudu', 'Rubiaceae', 'Morinda', 'Small tree with glossy leaves and pungent knobbly fruit.', 'Least Concern', 'Tropical Asia to the Pacific', 'Coasts and villages.', 'Fruit and leaves are used in traditional medicine.', 'Mengkudu', 'fruiting', 18.6, 46.0, 'broad', 'fruit', 'healthy', 'Field note 124. Habit: tree. Crown and stem match a fruiting healthy plant on the Penang Botanic Gardens plot.', 'Penang Botanic Gardens', 5.43844, 100.2912, 'ordinary', 'approved', '0000007c-4a20-4000-8000-000000000000'::uuid, 'plant-0000007c'),
  (125, 'Jasminum sambac', 'Arabian jasmine', 'Melur', 'Oleaceae', 'Jasminum', 'Scrambling shrub with white fragrant flowers.', 'Least Concern', 'Planted across tropical Asia', 'Gardens.', 'Flowers for garlands and tea.', 'Melur', 'mature', 6.0, 4.4, 'broad', 'none', 'healthy', 'Field note 125. Habit: climber. Crown and stem match a mature healthy plant on the Kuala Selangor Nature Park plot.', 'Kuala Selangor Nature Park', 3.33856, 101.24628, 'ordinary', 'approved', '0000007d-4a20-4000-8000-000000000000'::uuid, 'plant-0000007d'),
  (126, 'Myristica fragrans', 'Nutmeg', 'Pala', 'Myristicaceae', 'Myristica', 'Aromatic evergreen; the seed is nutmeg and the aril is mace.', 'Least Concern', 'Native to Maluku, planted in Malaysia', 'Spice gardens.', 'Historic spice tree.', 'Pala', 'fruiting', 17.4, 51.0, 'broad', 'fruit', 'fair', 'Field note 126. Habit: tree. Crown and stem match a fruiting fair plant on the FRIM canopy walk plot.', 'FRIM canopy walk, Kepong', 3.23748, 101.63232, 'ordinary', 'approved', '0000007e-4a20-4000-8000-000000000000'::uuid, 'plant-0000007e'),
  (127, 'Bougainvillea spectabilis', 'Bougainvillea', 'Bunga kertas', 'Nyctaginaceae', 'Bougainvillea', 'Thorny scrambler with coloured papery bracts.', 'Least Concern', 'Planted throughout the tropics', 'Sunny walls and fences.', 'The most common tropical ornamental climber.', 'Bunga kertas', 'flowering', 2.1, 6.2, 'broad', 'flowers', 'healthy', 'Field note 127. Habit: shrub. Crown and stem match a flowering healthy plant on the FRIM Rover track plot.', 'FRIM Rover track, Kepong', 3.2344, 101.6362, 'ordinary', 'approved', '0000007f-4a20-4000-8000-000000000000'::uuid, 'plant-0000007f'),
  (128, 'Magnolia champaca', 'Champaca', 'Cempaka', 'Magnoliaceae', 'Magnolia', 'Tall tree with strongly scented orange flowers.', 'Least Concern', 'South and Southeast Asia', 'Gardens and lowland forest.', 'Flowers for perfume and offerings.', 'Cempaka', 'seedling', 2.0, 3.0, 'broad', 'none', 'healthy', 'Field note 128. Habit: tree. Crown and stem match a seedling healthy plant on the Perdana Botanical Garden plot.', 'Perdana Botanical Garden', 3.14322, 101.68508, 'ordinary', 'submitted', '00000080-4a20-4000-8000-000000000000'::uuid, 'plant-00000080'),
  (129, 'Fagraea fragrans', 'Tembusu', 'Tembusu', 'Gentianaceae', 'Fagraea', 'Fine fissured bark and fragrant cream flowers.', 'Least Concern', 'Southeast Asia', 'Open country, coasts and parks.', 'A durable timber and a famous town tree in Singapore.', 'Tembusu', 'sapling', 6.1, 16.5, 'broad', 'none', 'healthy', 'Field note 129. Habit: tree. Crown and stem match a sapling healthy plant on the Perdana Lake edge plot.', 'Perdana Lake edge', 3.14174, 101.68632, 'ordinary', 'submitted', '00000081-4a20-4000-8000-000000000000'::uuid, 'plant-00000081'),
  (130, 'Mimusops elengi', 'Spanish cherry', 'Tanjung', 'Sapotaceae', 'Mimusops', 'Neat evergreen with small scented white flowers.', 'Least Concern', 'South and Southeast Asia', 'Streets and coastal gardens.', 'Shade tree; the flowers are traditional perfume.', 'Tanjung', 'mature', 18.0, 53.0, 'broad', 'none', 'healthy', 'Field note 130. Habit: tree. Crown and stem match a mature healthy plant on the Bukit Nanas Forest Reserve plot.', 'Bukit Nanas Forest Reserve', 3.15096, 101.7032, 'ordinary', 'submitted', '00000082-4a20-4000-8000-000000000000'::uuid, 'plant-00000082'),
  (131, 'Manilkara zapota', 'Sapodilla', 'Ciku', 'Sapotaceae', 'Manilkara', 'Rough brown fruit with sweet brown pulp, and latex in the bark.', 'Least Concern', 'Planted throughout the tropics', 'Gardens.', 'Fruit tree. The latex was an early source of chewing gum.', 'Ciku', 'flowering', 16.4, 49.5, 'broad', 'flowers', 'healthy', 'Field note 131. Habit: tree. Crown and stem match a flowering healthy plant on the KLCC Park plot.', 'KLCC Park', 3.15378, 101.71288, 'ordinary', 'submitted', '00000083-4a20-4000-8000-000000000000'::uuid, 'plant-00000083'),
  (132, 'Garcinia hombroniana', 'Seashore mangosteen', 'Beruas', 'Clusiaceae', 'Garcinia', 'Coastal relative of mangosteen with small sour fruit.', 'Least Concern', 'Coasts of Peninsular Malaysia and Borneo', 'Rocky and sandy shores.', 'A rootstock for mangosteen and a shore tree.', 'Beruas', 'fruiting', 17.8, 46.0, 'broad', 'fruit', 'healthy', 'Field note 132. Habit: tree. Crown and stem match a fruiting healthy plant on the Taman Tugu plot.', 'Taman Tugu', 3.1526, 101.68242, 'ordinary', 'submitted', '00000084-4a20-4000-8000-000000000000'::uuid, 'plant-00000084'),
  (133, 'Cratoxylum formosum', 'Pink mempat', 'Geronggang', 'Hypericaceae', 'Cratoxylum', 'Light crown and pink young leaves.', 'Least Concern', 'Southeast Asia', 'Secondary forest and poor soils.', 'Pioneer timber tree.', 'Geronggang', 'mature', 19.2, 50.5, 'broad', 'none', 'fair', 'Field note 133. Habit: tree. Crown and stem match a mature fair plant on the Rimba Ilmu plot.', 'Rimba Ilmu, Universiti Malaya', 3.13122, 101.6564, 'ordinary', 'submitted', '00000085-4a20-4000-8000-000000000000'::uuid, 'plant-00000085'),
  (134, 'Styrax benzoin', 'Benzoin', 'Kemenyan', 'Styracaceae', 'Styrax', 'Tree tapped for fragrant resin.', 'Least Concern', 'Sumatra, Peninsular Malaysia and Borneo', 'Hill forest.', 'Resin is incense, called kemenyan.', 'Kemenyan', 'fruiting', 18.6, 51.0, 'broad', 'fruit', 'healthy', 'Field note 134. Habit: tree. Crown and stem match a fruiting healthy plant on the Bukit Gasing forest plot.', 'Bukit Gasing forest', 3.09604, 101.65888, 'ordinary', 'submitted', '00000086-4a20-4000-8000-000000000000'::uuid, 'plant-00000086'),
  (135, 'Santalum album', 'Sandalwood', 'Cendana', 'Santalaceae', 'Santalum', 'Small hemi-parasitic tree with fragrant heartwood.', 'Vulnerable', 'Planted in tropical Asia; native to the Lesser Sunda Islands', 'Dry open woodland and trial plantings.', 'Heartwood is incense and oil. Marked rare.', 'Cendana', 'flowering', 16.0, 49.5, 'broad', 'flowers', 'healthy', 'Field note 135. Habit: tree. Crown and stem match a flowering healthy plant on the Kota Damansara Community Forest plot.', 'Kota Damansara Community Forest', 3.16756, 101.58212, 'rare', 'approved', '00000087-4a20-4000-8000-000000000000'::uuid, 'plant-00000087'),
  (136, 'Macaranga gigantea', 'Giant mahang', 'Mahang', 'Euphorbiaceae', 'Macaranga', 'Fast pioneer with huge round leaves.', 'Least Concern', 'Peninsular Malaysia, Sumatra and Borneo', 'Forest gaps and roadsides.', 'One of the first trees to fill a clearing.', 'Mahang', 'seedling', 1.2, 3.0, 'broad', 'none', 'poor', 'Field note 136. Habit: tree. Crown and stem match a seedling poor plant on the Taman Botani Negara Shah Alam plot.', 'Taman Botani Negara Shah Alam', 3.09818, 101.5068, 'ordinary', 'submitted', '00000088-4a20-4000-8000-000000000000'::uuid, 'plant-00000088'),
  (137, 'Scaphium macropodum', 'Malva nut', 'Kembang semangkuk', 'Malvaceae', 'Scaphium', 'Tall tree whose boat-shaped fruit opens into a wing.', 'Least Concern', 'Peninsular Malaysia, Sumatra and Borneo', 'Lowland forest.', 'The seed swells in water and is a traditional drink.', 'Kembang semangkuk', 'sapling', 5.3, 16.5, 'broad', 'none', 'healthy', 'Field note 137. Habit: tree. Crown and stem match a sapling healthy plant on the Putrajaya Botanical Garden plot.', 'Putrajaya Botanical Garden', 2.9448, 101.69988, 'ordinary', 'submitted', '00000089-4a20-4000-8000-000000000000'::uuid, 'plant-00000089'),
  (138, 'Pandanus amaryllifolius', 'Pandan', 'Pandan', 'Pandanaceae', 'Pandanus', 'Clump of fragrant strap leaves.', 'Least Concern', 'Cultivated across Southeast Asia', 'House gardens.', 'Leaves scent rice, sweets and drinks.', 'Pandan', 'mature', 2.65, 6.8, 'narrow', 'none', 'healthy', 'Field note 138. Habit: shrub. Crown and stem match a mature healthy plant on the Penang Botanic Gardens plot.', 'Penang Botanic Gardens', 5.43802, 100.29072, 'ordinary', 'submitted', '0000008a-4a20-4000-8000-000000000000'::uuid, 'plant-0000008a'),
  (139, 'Piper betle', 'Betel', 'Sirih', 'Piperaceae', 'Piper', 'Heart-shaped leaves on a climbing vine.', 'Least Concern', 'South and Southeast Asia', 'Gardens and forest edges.', 'Leaf of the betel chew, with pinang.', 'Sirih', 'flowering', 6.6, 4.2, 'broad', 'flowers', 'healthy', 'Field note 139. Habit: climber. Crown and stem match a flowering healthy plant on the Kuala Selangor Nature Park plot.', 'Kuala Selangor Nature Park', 3.34024, 101.2458, 'ordinary', 'submitted', '0000008b-4a20-4000-8000-000000000000'::uuid, 'plant-0000008b')
;



create temp table seed_photos (
  scientific_name text primary key,
  photo_url text not null
) on commit drop;

insert into seed_photos (scientific_name, photo_url) values
  ('Shorea leprosula', 'https://inaturalist-open-data.s3.amazonaws.com/photos/965084/medium.JPG'),
  ('Shorea parvifolia', 'https://inaturalist-open-data.s3.amazonaws.com/photos/1475591/medium.jpg'),
  ('Shorea curtisii', 'https://inaturalist-open-data.s3.amazonaws.com/photos/1454881/medium.jpg'),
  ('Shorea ovalis', 'https://inaturalist-open-data.s3.amazonaws.com/photos/574226008/medium.jpg'),
  ('Shorea macroptera', 'https://inaturalist-open-data.s3.amazonaws.com/photos/1475590/medium.jpg'),
  ('Dipterocarpus grandiflorus', 'https://inaturalist-open-data.s3.amazonaws.com/photos/36173010/medium.jpeg'),
  ('Dipterocarpus baudii', 'https://inaturalist-open-data.s3.amazonaws.com/photos/2098406/medium.jpeg'),
  ('Dryobalanops aromatica', 'https://inaturalist-open-data.s3.amazonaws.com/photos/1447129/medium.jpg'),
  ('Hopea odorata', 'https://inaturalist-open-data.s3.amazonaws.com/photos/258495628/medium.jpg'),
  ('Hopea beccariana', 'https://inaturalist-open-data.s3.amazonaws.com/photos/246603349/medium.jpeg'),
  ('Anisoptera costata', 'https://inaturalist-open-data.s3.amazonaws.com/photos/2098416/medium.jpg'),
  ('Neobalanocarpus heimii', 'https://inaturalist-open-data.s3.amazonaws.com/photos/1451769/medium.jpg'),
  ('Parashorea malaanonan', 'https://static.inaturalist.org/photos/55133625/medium.jpg'),
  ('Cotylelobium melanoxylon', 'https://inaturalist-open-data.s3.amazonaws.com/photos/578750237/medium.jpg'),
  ('Koompassia excelsa', 'https://inaturalist-open-data.s3.amazonaws.com/photos/723524/medium.JPG'),
  ('Koompassia malaccensis', 'https://inaturalist-open-data.s3.amazonaws.com/photos/1449340/medium.jpg'),
  ('Intsia palembanica', 'https://inaturalist-open-data.s3.amazonaws.com/photos/216706733/medium.jpeg'),
  ('Dialium indum', 'https://inaturalist-open-data.s3.amazonaws.com/photos/1455887/medium.jpg'),
  ('Sindora coriacea', 'https://inaturalist-open-data.s3.amazonaws.com/photos/1467646/medium.jpg'),
  ('Parkia speciosa', 'https://inaturalist-open-data.s3.amazonaws.com/photos/24158799/medium.jpg'),
  ('Archidendron jiringa', 'https://static.inaturalist.org/photos/37861708/medium.jpg'),
  ('Tamarindus indica', 'https://inaturalist-open-data.s3.amazonaws.com/photos/40233197/medium.jpeg'),
  ('Delonix regia', 'https://inaturalist-open-data.s3.amazonaws.com/photos/633179546/medium.jpg'),
  ('Cassia fistula', 'https://inaturalist-open-data.s3.amazonaws.com/photos/33340060/medium.jpeg'),
  ('Senna alata', 'https://inaturalist-open-data.s3.amazonaws.com/photos/26538017/medium.jpeg'),
  ('Peltophorum pterocarpum', 'https://inaturalist-open-data.s3.amazonaws.com/photos/145183218/medium.jpeg'),
  ('Samanea saman', 'https://inaturalist-open-data.s3.amazonaws.com/photos/58693810/medium.jpeg'),
  ('Adenanthera pavonina', 'https://inaturalist-open-data.s3.amazonaws.com/photos/20605511/medium.jpg'),
  ('Pterocarpus indicus', 'https://inaturalist-open-data.s3.amazonaws.com/photos/65718753/medium.jpeg'),
  ('Bauhinia purpurea', 'https://static.inaturalist.org/photos/103234479/medium.jpeg'),
  ('Caesalpinia pulcherrima', 'https://inaturalist-open-data.s3.amazonaws.com/photos/4952725/medium.jpg'),
  ('Ficus benjamina', 'https://inaturalist-open-data.s3.amazonaws.com/photos/68686046/medium.jpeg'),
  ('Ficus religiosa', 'https://inaturalist-open-data.s3.amazonaws.com/photos/119134047/medium.jpeg'),
  ('Ficus racemosa', 'https://inaturalist-open-data.s3.amazonaws.com/photos/543823554/medium.jpg'),
  ('Ficus microcarpa', 'https://inaturalist-open-data.s3.amazonaws.com/photos/59896114/medium.jpeg'),
  ('Artocarpus heterophyllus', 'https://inaturalist-open-data.s3.amazonaws.com/photos/332097864/medium.jpeg'),
  ('Artocarpus integer', 'https://inaturalist-open-data.s3.amazonaws.com/photos/1455935/medium.jpg'),
  ('Artocarpus altilis', 'https://inaturalist-open-data.s3.amazonaws.com/photos/28587244/medium.jpg'),
  ('Artocarpus odoratissimus', 'https://inaturalist-open-data.s3.amazonaws.com/photos/1445265/medium.jpg'),
  ('Mangifera indica', 'https://static.inaturalist.org/photos/234675028/medium.jpeg'),
  ('Mangifera odorata', 'https://inaturalist-open-data.s3.amazonaws.com/photos/31416363/medium.jpeg'),
  ('Mangifera foetida', 'https://static.inaturalist.org/photos/611102670/medium.jpg'),
  ('Anacardium occidentale', 'https://static.inaturalist.org/photos/334229443/medium.jpeg'),
  ('Bouea macrophylla', 'https://inaturalist-open-data.s3.amazonaws.com/photos/337089945/medium.jpeg'),
  ('Spondias dulcis', 'https://inaturalist-open-data.s3.amazonaws.com/photos/38017949/medium.jpeg'),
  ('Durio zibethinus', 'https://inaturalist-open-data.s3.amazonaws.com/photos/115310642/medium.jpeg'),
  ('Durio graveolens', 'https://inaturalist-open-data.s3.amazonaws.com/photos/413511415/medium.jpg'),
  ('Nephelium lappaceum', 'https://inaturalist-open-data.s3.amazonaws.com/photos/185103210/medium.jpg'),
  ('Nephelium mutabile', 'https://inaturalist-open-data.s3.amazonaws.com/photos/1467959/medium.jpg'),
  ('Lansium domesticum', 'https://inaturalist-open-data.s3.amazonaws.com/photos/970889/medium.JPG'),
  ('Dimocarpus longan', 'https://static.inaturalist.org/photos/53712016/medium.jpg'),
  ('Baccaurea motleyana', 'https://inaturalist-open-data.s3.amazonaws.com/photos/24582748/medium.jpg'),
  ('Garcinia mangostana', 'https://inaturalist-open-data.s3.amazonaws.com/photos/75812/medium.jpg'),
  ('Garcinia atroviridis', 'https://inaturalist-open-data.s3.amazonaws.com/photos/1460019/medium.jpg'),
  ('Syzygium aqueum', 'https://inaturalist-open-data.s3.amazonaws.com/photos/354338569/medium.jpeg'),
  ('Syzygium malaccense', 'https://inaturalist-open-data.s3.amazonaws.com/photos/178790256/medium.jpg'),
  ('Syzygium samarangense', 'https://inaturalist-open-data.s3.amazonaws.com/photos/72601410/medium.jpeg'),
  ('Syzygium aromaticum', 'https://inaturalist-open-data.s3.amazonaws.com/photos/209515366/medium.jpg'),
  ('Psidium guajava', 'https://inaturalist-open-data.s3.amazonaws.com/photos/751951189/medium.jpg'),
  ('Rhodomyrtus tomentosa', 'https://static.inaturalist.org/photos/76826234/medium.jpg'),
  ('Melaleuca cajuputi', 'https://inaturalist-open-data.s3.amazonaws.com/photos/921584/medium.JPG'),
  ('Cinnamomum iners', 'https://inaturalist-open-data.s3.amazonaws.com/photos/73669348/medium.jpg'),
  ('Cinnamomum verum', 'https://inaturalist-open-data.s3.amazonaws.com/photos/601104/medium.jpg'),
  ('Litsea garciae', 'https://inaturalist-open-data.s3.amazonaws.com/photos/68652546/medium.jpeg'),
  ('Persea americana', 'https://static.inaturalist.org/photos/188938346/medium.jpg'),
  ('Aquilaria malaccensis', 'https://inaturalist-open-data.s3.amazonaws.com/photos/97894770/medium.jpeg'),
  ('Gonystylus bancanus', 'https://inaturalist-open-data.s3.amazonaws.com/photos/29802710/medium.jpeg'),
  ('Eusideroxylon zwageri', 'https://inaturalist-open-data.s3.amazonaws.com/photos/15558/medium.jpg'),
  ('Palaquium gutta', 'https://inaturalist-open-data.s3.amazonaws.com/photos/1469200/medium.jpg'),
  ('Dyera costulata', 'https://inaturalist-open-data.s3.amazonaws.com/photos/921509/medium.JPG'),
  ('Alstonia angustiloba', 'https://inaturalist-open-data.s3.amazonaws.com/photos/706823/medium.JPG'),
  ('Plumeria rubra', 'https://static.inaturalist.org/photos/70240531/medium.jpg'),
  ('Cerbera odollam', 'https://inaturalist-open-data.s3.amazonaws.com/photos/14456256/medium.jpeg'),
  ('Allamanda cathartica', 'https://inaturalist-open-data.s3.amazonaws.com/photos/1892953/medium.JPG'),
  ('Catharanthus roseus', 'https://inaturalist-open-data.s3.amazonaws.com/photos/625888487/medium.jpg'),
  ('Cananga odorata', 'https://inaturalist-open-data.s3.amazonaws.com/photos/970863/medium.JPG'),
  ('Annona muricata', 'https://inaturalist-open-data.s3.amazonaws.com/photos/335268174/medium.jpg'),
  ('Annona squamosa', 'https://static.inaturalist.org/photos/43278599/medium.jpeg'),
  ('Polyalthia longifolia', 'https://inaturalist-open-data.s3.amazonaws.com/photos/510654549/medium.jpg'),
  ('Canarium odontophyllum', 'https://inaturalist-open-data.s3.amazonaws.com/photos/1471242/medium.jpg'),
  ('Sandoricum koetjape', 'https://inaturalist-open-data.s3.amazonaws.com/photos/13347447/medium.jpeg'),
  ('Swietenia macrophylla', 'https://inaturalist-open-data.s3.amazonaws.com/photos/38634940/medium.jpeg'),
  ('Azadirachta indica', 'https://static.inaturalist.org/photos/70176803/medium.jpg'),
  ('Lagerstroemia speciosa', 'https://inaturalist-open-data.s3.amazonaws.com/photos/79053352/medium.jpg'),
  ('Terminalia catappa', 'https://static.inaturalist.org/photos/51210593/medium.jpeg'),
  ('Hibiscus rosa-sinensis', 'https://static.inaturalist.org/photos/25533484/medium.jpg'),
  ('Hibiscus tiliaceus', 'https://inaturalist-open-data.s3.amazonaws.com/photos/19582594/medium.jpeg'),
  ('Theobroma cacao', 'https://inaturalist-open-data.s3.amazonaws.com/photos/306622911/medium.jpeg'),
  ('Ceiba pentandra', 'https://inaturalist-open-data.s3.amazonaws.com/photos/32279278/medium.jpg'),
  ('Cocos nucifera', 'https://inaturalist-open-data.s3.amazonaws.com/photos/2373013/medium.JPG'),
  ('Areca catechu', 'https://inaturalist-open-data.s3.amazonaws.com/photos/46240266/medium.jpeg'),
  ('Elaeis guineensis', 'https://inaturalist-open-data.s3.amazonaws.com/photos/333000809/medium.jpeg'),
  ('Cyrtostachys renda', 'https://inaturalist-open-data.s3.amazonaws.com/photos/106888604/medium.jpg'),
  ('Roystonea regia', 'https://inaturalist-open-data.s3.amazonaws.com/photos/54746483/medium.jpeg'),
  ('Arenga pinnata', 'https://inaturalist-open-data.s3.amazonaws.com/photos/42096462/medium.jpg'),
  ('Oncosperma tigillarium', 'https://inaturalist-open-data.s3.amazonaws.com/photos/118272895/medium.jpg'),
  ('Nypa fruticans', 'https://inaturalist-open-data.s3.amazonaws.com/photos/1261975/medium.JPG'),
  ('Salacca zalacca', 'https://inaturalist-open-data.s3.amazonaws.com/photos/70800003/medium.jpeg'),
  ('Livistona chinensis', 'https://inaturalist-open-data.s3.amazonaws.com/photos/121324857/medium.jpg'),
  ('Licuala grandis', 'https://inaturalist-open-data.s3.amazonaws.com/photos/126843/medium.jpg'),
  ('Calamus manan', 'https://inaturalist-open-data.s3.amazonaws.com/photos/563562776/medium.jpg'),
  ('Musa acuminata', 'https://inaturalist-open-data.s3.amazonaws.com/photos/3004694/medium.jpg'),
  ('Etlingera elatior', 'https://static.inaturalist.org/photos/32834703/medium.jpeg'),
  ('Bambusa vulgaris', 'https://inaturalist-open-data.s3.amazonaws.com/photos/104285251/medium.jpeg'),
  ('Dendrocalamus asper', 'https://inaturalist-open-data.s3.amazonaws.com/photos/91801655/medium.jpeg'),
  ('Dendrobium crumenatum', 'https://inaturalist-open-data.s3.amazonaws.com/photos/166407049/medium.jpeg'),
  ('Grammatophyllum speciosum', 'https://inaturalist-open-data.s3.amazonaws.com/photos/13916347/medium.jpeg'),
  ('Phalaenopsis amabilis', 'https://static.inaturalist.org/photos/69630016/medium.jpeg'),
  ('Vanda dearei', 'https://inaturalist-open-data.s3.amazonaws.com/photos/336028233/medium.jpg'),
  ('Nepenthes rafflesiana', 'https://inaturalist-open-data.s3.amazonaws.com/photos/79482/medium.jpg'),
  ('Rafflesia cantleyi', 'https://inaturalist-open-data.s3.amazonaws.com/photos/31409878/medium.jpeg'),
  ('Agathis borneensis', 'https://inaturalist-open-data.s3.amazonaws.com/photos/551837950/medium.jpg'),
  ('Casuarina equisetifolia', 'https://inaturalist-open-data.s3.amazonaws.com/photos/16450498/medium.jpeg'),
  ('Dillenia suffruticosa', 'https://static.inaturalist.org/photos/41506861/medium.jpg'),
  ('Mesua ferrea', 'https://inaturalist-open-data.s3.amazonaws.com/photos/814865/medium.JPG'),
  ('Rhizophora apiculata', 'https://inaturalist-open-data.s3.amazonaws.com/photos/50573170/medium.jpeg'),
  ('Ixora coccinea', 'https://inaturalist-open-data.s3.amazonaws.com/photos/507269617/medium.jpg'),
  ('Citrus hystrix', 'https://inaturalist-open-data.s3.amazonaws.com/photos/378083246/medium.jpg'),
  ('Asplenium nidus', 'https://static.inaturalist.org/photos/230834449/medium.jpeg'),
  ('Tectona grandis', 'https://static.inaturalist.org/photos/88386046/medium.jpg'),
  ('Hevea brasiliensis', 'https://inaturalist-open-data.s3.amazonaws.com/photos/60706943/medium.jpeg'),
  ('Morinda citrifolia', 'https://inaturalist-open-data.s3.amazonaws.com/photos/99909871/medium.jpg'),
  ('Jasminum sambac', 'https://static.inaturalist.org/photos/77617055/medium.jpg'),
  ('Myristica fragrans', 'https://inaturalist-open-data.s3.amazonaws.com/photos/75657/medium.jpg'),
  ('Bougainvillea spectabilis', 'https://inaturalist-open-data.s3.amazonaws.com/photos/660099975/medium.jpg'),
  ('Magnolia champaca', 'https://inaturalist-open-data.s3.amazonaws.com/photos/21480087/medium.jpeg'),
  ('Fagraea fragrans', 'https://inaturalist-open-data.s3.amazonaws.com/photos/145569733/medium.jpg'),
  ('Mimusops elengi', 'https://inaturalist-open-data.s3.amazonaws.com/photos/536283461/medium.jpg'),
  ('Manilkara zapota', 'https://inaturalist-open-data.s3.amazonaws.com/photos/124479510/medium.jpg'),
  ('Garcinia hombroniana', 'https://inaturalist-open-data.s3.amazonaws.com/photos/1460022/medium.jpeg'),
  ('Cratoxylum formosum', 'https://static.inaturalist.org/photos/34696249/medium.jpg'),
  ('Styrax benzoin', 'https://inaturalist-open-data.s3.amazonaws.com/photos/1455903/medium.jpg'),
  ('Santalum album', 'https://inaturalist-open-data.s3.amazonaws.com/photos/30611222/medium.jpeg'),
  ('Macaranga gigantea', 'https://inaturalist-open-data.s3.amazonaws.com/photos/36952487/medium.jpeg'),
  ('Scaphium macropodum', 'https://static.inaturalist.org/photos/251552960/medium.jpg'),
  ('Pandanus amaryllifolius', 'https://static.inaturalist.org/photos/237113498/medium.jpg'),
  ('Piper betle', 'https://inaturalist-open-data.s3.amazonaws.com/photos/165347055/medium.jpeg');

do $$
declare
  v_owner uuid;
  v_reviewer uuid;
  v_local_type text;
  v_local_expr text;
  v_species_sql text;
  v_plant_sql text;
  v_trigger record;
begin
  select uuid into v_owner
  from public.profiles
  where role = 'botanist' and status = 'active'
  order by id
  limit 1;

  if v_owner is null then
    select uuid into v_owner
    from public.profiles
    where status = 'active'
      and role in ('administrator', 'conservation_officer', 'botanist')
    order by case role when 'botanist' then 0 when 'conservation_officer' then 1 else 2 end, id
    limit 1;
  end if;

  if v_owner is null then
    raise exception 'No active staff profile found. Create an administrator or botanist, then run this script again.';
  end if;

  select uuid into v_reviewer
  from public.profiles
  where role = 'conservation_officer' and status = 'active'
  order by id
  limit 1;

  if v_reviewer is null then
    v_reviewer := v_owner;
  end if;

  create temp table seed_botanists on commit drop as
  select uuid, (row_number() over (order by id) - 1)::int as slot
  from public.profiles
  where role = 'botanist' and status = 'active';

  if not exists (select 1 from seed_botanists) then
    insert into seed_botanists (uuid, slot) values (v_owner, 0);
  end if;

  -- Staff-only triggers read auth.uid(). The SQL editor has no signed-in user, so borrow this profile.
  perform set_config('request.jwt.claim.sub', v_owner::text, true);
  perform set_config('request.jwt.claim.role', 'authenticated', true);
  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', v_owner, 'role', 'authenticated')::text,
    true
  );

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'species' and column_name = 'created_by'
  ) then
    v_species_sql := 'insert into public.species (
        scientific_name, common_name, local_name, family, genus, description,
        conservation_status, distribution, ecological_info, cultural_significance, created_by
      )
      select
        c.scientific_name, c.common_name, c.local_name, c.family, c.genus, c.description,
        c.conservation_status, c.distribution, c.ecological_info, c.cultural_significance, $1
      from seed_catalog c
      where not exists (
        select 1 from public.species s
        where lower(s.scientific_name) = lower(c.scientific_name)
      )';
    execute v_species_sql using v_owner;
  else
    insert into public.species (
      scientific_name, common_name, local_name, family, genus, description,
      conservation_status, distribution, ecological_info, cultural_significance
    )
    select
      c.scientific_name, c.common_name, c.local_name, c.family, c.genus, c.description,
      c.conservation_status, c.distribution, c.ecological_info, c.cultural_significance
    from seed_catalog c
    where not exists (
      select 1 from public.species s
      where lower(s.scientific_name) = lower(c.scientific_name)
    );
  end if;

  select data_type into v_local_type
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'plant_records'
    and column_name = 'local_id';

  if v_local_type = 'uuid' then
    v_local_expr := 'c.local_id';
  else
    v_local_expr := 'c.local_id::text';
  end if;

  -- Keep id-assignment triggers. Turn off only the staff-access trigger, which rejects a SQL-editor session.
  for v_trigger in
    select tgname
    from pg_trigger
    where tgrelid = 'public.plant_records'::regclass
      and not tgisinternal
      and pg_get_triggerdef(oid) ilike '%enforce_plant_record_access%'
  loop
    execute format('alter table public.plant_records disable trigger %I', v_trigger.tgname);
  end loop;

  v_plant_sql := format($sql$
    insert into public.plant_records (
      botanist_id, local_id, plant_name, life_stage, species_id,
      height_m, trunk_diameter_cm, leaf_traits, flower_fruit_traits, health_status,
      other_traits, location_name, latitude, longitude, qr_code, visibility, status,
      sync_status, recorded_at, reviewed_by, reviewed_at, review_note
    )
    select
      $1,
      %s,
      c.plant_name,
      c.life_stage,
      s.uuid,
      c.height_m,
      c.trunk_diameter_cm,
      c.leaf_traits,
      c.flower_fruit_traits,
      c.health_status,
      c.other_traits,
      c.location_name,
      c.latitude,
      c.longitude,
      c.qr_code,
      c.visibility,
      'submitted',
      'synced',
      now() - (c.n::text || ' days')::interval,
      null,
      null,
      null
    from seed_catalog c
    join public.species s on lower(s.scientific_name) = lower(c.scientific_name)
    where not exists (
      select 1 from public.plant_records p where p.qr_code = c.qr_code
    )
  $sql$, v_local_expr);

  begin
    -- The insert trigger only accepts the signed-in botanist. Split ownership after it is turned off.
    execute v_plant_sql using v_owner;
  exception
    when undefined_column then
      -- Older databases may lack sync_status or review columns. Insert the core field set.
      v_plant_sql := format($sql$
        insert into public.plant_records (
          botanist_id, local_id, plant_name, life_stage, species_id,
          height_m, trunk_diameter_cm, leaf_traits, flower_fruit_traits, health_status,
          other_traits, location_name, latitude, longitude, qr_code, visibility, status, recorded_at
        )
        select
          $1,
          %s,
          c.plant_name,
          c.life_stage,
          s.uuid,
          c.height_m,
          c.trunk_diameter_cm,
          c.leaf_traits,
          c.flower_fruit_traits,
          c.health_status,
          c.other_traits,
          c.location_name,
          c.latitude,
          c.longitude,
          c.qr_code,
          c.visibility,
          'submitted',
          now() - (c.n::text || ' days')::interval
        from seed_catalog c
        join public.species s on lower(s.scientific_name) = lower(c.scientific_name)
        where not exists (
          select 1 from public.plant_records p where p.qr_code = c.qr_code
        )
      $sql$, v_local_expr);
      execute v_plant_sql using v_owner;
  end;

  -- protect_plant_record() rejects a new row that is already approved.
  -- Insert as submitted, then mark the catalogue rows approved with this trigger off.
  for v_trigger in
    select t.tgname
    from pg_trigger t
    join pg_proc p on p.oid = t.tgfoid
    where t.tgrelid = 'public.plant_records'::regclass
      and not t.tgisinternal
      and p.proname = 'protect_plant_record'
  loop
    execute format('alter table public.plant_records disable trigger %I', v_trigger.tgname);
  end loop;

  begin
    update public.plant_records p
    set
      status = 'approved',
      reviewed_by = v_reviewer,
      reviewed_at = now() - ((c.n % 5)::text || ' days')::interval,
      review_note = 'Seeded catalogue record.'
    from seed_catalog c
    where p.qr_code = c.qr_code
      and c.status = 'approved';
  exception
    when undefined_column then
      update public.plant_records p
      set status = 'approved'
      from seed_catalog c
      where p.qr_code = c.qr_code
        and c.status = 'approved';
  end;

  -- Plants already loaded by an earlier run are moved onto the same rotation.
  update public.plant_records p
  set botanist_id = b.uuid
  from seed_catalog c
  join seed_botanists b
    on b.slot = (c.n - 1) % (select count(*)::int from seed_botanists)
  where p.qr_code = c.qr_code
    and p.botanist_id is distinct from b.uuid;


  -- Catalogue photographs. One row on the plant, one on the species, both using the same picture.
  alter table public.plant_photos disable trigger user;
  delete from public.plant_photos ph
  using public.plant_records p, seed_catalog c
  where ph.plant_record_id = p.uuid
    and p.qr_code = c.qr_code;
  delete from public.plant_photos ph
  using public.species s, seed_photos sp
  where ph.species_id = s.uuid
    and lower(s.scientific_name) = lower(sp.scientific_name)
    and ph.plant_record_id is null;
  insert into public.plant_photos (plant_record_id, storage_path, caption, uploaded_by)
  select p.uuid, sp.photo_url, c.plant_name, p.botanist_id
  from seed_catalog c
  join seed_photos sp on lower(sp.scientific_name) = lower(c.scientific_name)
  join public.plant_records p on p.qr_code = c.qr_code;
  insert into public.plant_photos (species_id, storage_path, caption, uploaded_by)
  select s.uuid, sp.photo_url, c.plant_name, p.botanist_id
  from seed_catalog c
  join seed_photos sp on lower(sp.scientific_name) = lower(c.scientific_name)
  join public.species s on lower(s.scientific_name) = lower(c.scientific_name)
  join public.plant_records p on p.qr_code = c.qr_code;
  alter table public.plant_photos enable trigger user;

  for v_trigger in
    select t.tgname
    from pg_trigger t
    join pg_proc p on p.oid = t.tgfoid
    where t.tgrelid = 'public.plant_records'::regclass
      and not t.tgisinternal
      and p.proname = 'protect_plant_record'
  loop
    execute format('alter table public.plant_records enable trigger %I', v_trigger.tgname);
  end loop;

  for v_trigger in
    select tgname
    from pg_trigger
    where tgrelid = 'public.plant_records'::regclass
      and not tgisinternal
      and pg_get_triggerdef(oid) ilike '%enforce_plant_record_access%'
  loop
    execute format('alter table public.plant_records enable trigger %I', v_trigger.tgname);
  end loop;
end $$;

commit;

select count(*) as species_count from public.species;
select pf.id as botanist, p.status, count(*) as plants
from public.plant_records p
join public.profiles pf on pf.uuid = p.botanist_id
group by pf.id, p.status
order by pf.id, p.status;
