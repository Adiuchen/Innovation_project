-- 100 extra species for the catalogue.
-- Run this whole file once in the Supabase SQL editor.
-- Species only: it does not create field plants or photographs.
-- Safe to run again. A scientific name that is already stored is skipped.
-- Names here do not overlap the 139 species in seed-plants.sql.

begin;

create temp table seed_species (
  scientific_name text not null,
  common_name text not null,
  local_name text not null,
  family text not null,
  genus text not null,
  description text not null,
  conservation_status text not null,
  distribution text not null,
  ecological_info text not null,
  cultural_significance text not null
) on commit drop;

insert into seed_species (
  scientific_name, common_name, local_name, family, genus, description,
  conservation_status, distribution, ecological_info, cultural_significance
) values
  ('Shorea roxburghii', 'White meranti', 'Meranti temak', 'Dipterocarpaceae', 'Shorea', 'Dipterocarp with a pale bole and light hardwood.', 'Least Concern', 'Indochina to Peninsular Malaysia', 'Lowland and hill forest, and sometimes planted as a roadside tree.', 'Sold as white meranti timber.'),
  ('Shorea pauciflora', 'Nemesu', 'Nemesu', 'Dipterocarpaceae', 'Shorea', 'Dark red meranti with a tall straight bole.', 'Endangered', 'Peninsular Malaysia, Sumatra and Borneo', 'Lowland dipterocarp forest; large trees are now scarce after logging.', 'A sought-after dark red meranti.'),
  ('Shorea acuminata', 'Meranti rambai daun', 'Meranti rambai daun', 'Dipterocarpaceae', 'Shorea', 'Red meranti named for its tufted leafy shoots.', 'Least Concern', 'Peninsular Malaysia and Sumatra', 'Lowland forest on clay soils.', 'Commercial light hardwood.'),
  ('Shorea bracteolata', 'Meranti pa''ang', 'Meranti pa''ang', 'Dipterocarpaceae', 'Shorea', 'White meranti with conspicuous bracts on the young growth.', 'Least Concern', 'Peninsular Malaysia, Sumatra and Borneo', 'Lowland and hill forest.', 'Grouped with white meranti timber.'),
  ('Shorea faguetiana', 'Yellow meranti', 'Seraya kuning', 'Dipterocarpaceae', 'Shorea', 'Very tall yellow meranti; some crowns are among the tallest in the tropics.', 'Endangered', 'Peninsular Malaysia and Borneo', 'Hill and lowland dipterocarp forest.', 'Yellow meranti timber. Large standing trees are uncommon.'),
  ('Shorea johorensis', 'Meranti majau', 'Meranti majau', 'Dipterocarpaceae', 'Shorea', 'Light red meranti with a long clear bole.', 'Endangered', 'Peninsular Malaysia, Sumatra and Borneo', 'Lowland forest, heavily logged across its range.', 'A main light red meranti of the timber trade.'),
  ('Dipterocarpus cornutus', 'Keruing gombang', 'Keruing gombang', 'Dipterocarpaceae', 'Dipterocarpus', 'Keruing with horned fruit wings and resinous bark.', 'Endangered', 'Peninsular Malaysia, Sumatra and Borneo', 'Lowland forest on well-drained ground.', 'Keruing timber. Resin has been collected as dammar.'),
  ('Dipterocarpus costatus', 'Keruing bukit', 'Keruing bukit', 'Dipterocarpaceae', 'Dipterocarpus', 'Hill keruing with a ribbed fruit and a dark crown.', 'Endangered', 'Mainland Southeast Asia to Peninsular Malaysia', 'Hill forest above the main lowland belt.', 'Structural timber from hill forest.'),
  ('Dryobalanops oblongifolia', 'Keladan', 'Keladan', 'Dipterocarpaceae', 'Dryobalanops', 'Camphor relative with a columnar trunk and aromatic wood.', 'Vulnerable', 'Peninsular Malaysia, Sumatra and Borneo', 'Lowland forest, including swamp edges.', 'Keladan timber. The wood has a faint camphor scent.'),
  ('Hopea ferrea', 'Giam', 'Giam', 'Dipterocarpaceae', 'Hopea', 'Slow tree with extremely hard, heavy wood.', 'Endangered', 'Thailand, Peninsular Malaysia and Sumatra', 'Ridge forest and rocky soils.', 'Giam is a traditional heavy construction timber.'),
  ('Vatica pauciflora', 'Swamp resak', 'Resak paya', 'Dipterocarpaceae', 'Vatica', 'Small dipterocarp of peat and freshwater swamp.', 'Endangered', 'Peninsular Malaysia, Sumatra and Borneo', 'Peat swamp forest, much of it now cleared.', 'Resak timber from swamp forest.'),
  ('Anisoptera laevis', 'Mersawa durian', 'Mersawa durian', 'Dipterocarpaceae', 'Anisoptera', 'Tall mersawa with a smooth bole and winged fruit.', 'Endangered', 'Peninsular Malaysia, Sumatra and Borneo', 'Lowland dipterocarp forest.', 'Mersawa timber, now scarce as large trees.'),
  ('Parashorea densiflora', 'Meranti pasir', 'Meranti pasir', 'Dipterocarpaceae', 'Parashorea', 'White seraya of sandy and heath forest.', 'Near Threatened', 'Peninsular Malaysia and Sumatra', 'Lowland forest on sandy soils.', 'Timber grouped with white seraya.'),
  ('Rhizophora mucronata', 'Loop-root mangrove', 'Bakau kurap', 'Rhizophoraceae', 'Rhizophora', 'Mangrove with long stilt roots and a pointed leaf tip.', 'Least Concern', 'Tropical coasts of Asia and Africa', 'Seaward and mid-zone mangrove mud.', 'Poles, charcoal and a main mangrove timber.'),
  ('Bruguiera gymnorhiza', 'Large-leafed mangrove', 'Tumu', 'Rhizophoraceae', 'Bruguiera', 'Mangrove with knee roots and large scarlet flowers.', 'Least Concern', 'Tropical Asian and Pacific coasts', 'Middle and landward mangrove.', 'Bark has been used for dye and tannin.'),
  ('Bruguiera cylindrica', 'Small-leafed mangrove', 'Berus', 'Rhizophoraceae', 'Bruguiera', 'Smaller mangrove with pale green flowers and knee roots.', 'Least Concern', 'Tropical Asian coasts', 'Landward mangrove and tidal creeks.', 'Firewood and local poles.'),
  ('Ceriops tagal', 'Spurred mangrove', 'Tengar', 'Rhizophoraceae', 'Ceriops', 'Compact mangrove with a spur beside the fruit.', 'Least Concern', 'Tropical coasts from East Africa to the Pacific', 'Drier, higher mangrove ground.', 'Durable poles and tannin bark.'),
  ('Avicennia marina', 'Grey mangrove', 'Api-api jambu', 'Acanthaceae', 'Avicennia', 'Pioneer mangrove with pencil roots and a grey crown.', 'Least Concern', 'Tropical and subtropical coasts', 'Seaward mud and newly settled banks.', 'A first coloniser of bare mangrove mud.'),
  ('Avicennia alba', 'White mangrove', 'Api-api putih', 'Acanthaceae', 'Avicennia', 'Mangrove with a pale underside to the leaf.', 'Least Concern', 'South and Southeast Asian coasts', 'Soft mud on the seaward edge.', 'Pioneer tree of accreting shores.'),
  ('Sonneratia caseolaris', 'Mangrove apple', 'Berembang', 'Lythraceae', 'Sonneratia', 'Mangrove with upright breathing roots and sour apple-like fruit.', 'Least Concern', 'Tropical Asian coasts and tidal rivers', 'Upstream mangrove where the water is less salty.', 'The sour fruit is eaten in some places.'),
  ('Sonneratia alba', 'Perepat', 'Perepat', 'Lythraceae', 'Sonneratia', 'Seaward mangrove with white flowers and conical pneumatophores.', 'Least Concern', 'Tropical coasts from East Africa to the Pacific', 'The front of the mangrove, often in sandier mud.', 'Flowers open at dusk and are visited by bats.'),
  ('Xylocarpus granatum', 'Cannonball mangrove', 'Nyireh bunga', 'Meliaceae', 'Xylocarpus', 'Mangrove with large round fruit and a flaking bole.', 'Least Concern', 'Tropical Asian and Pacific coasts', 'Landward mangrove and tidal creeks.', 'The puzzle-like fruit is a well-known mangrove curiosity.'),
  ('Lumnitzera littorea', 'Red-flowered mangrove', 'Teruntum merah', 'Combretaceae', 'Lumnitzera', 'Small mangrove tree with bright red flowers.', 'Least Concern', 'Tropical Asian coasts', 'Landward mangrove and sandy tidal ground.', 'Ornamental flowers; wood is hard and heavy.'),
  ('Heritiera littoralis', 'Looking-glass mangrove', 'Dungun', 'Malvaceae', 'Heritiera', 'Shore tree with a silvery underside to the leaf.', 'Least Concern', 'Tropical coasts of the Indo-Pacific', 'Behind the mangrove and on rocky shores.', 'Dungun timber is hard and was used for boats.'),
  ('Barringtonia asiatica', 'Fish-poison tree', 'Putat laut', 'Lecythidaceae', 'Barringtonia', 'Coastal tree with large boxy fruit that floats.', 'Least Concern', 'Tropical Asian and Pacific shores', 'Sandy beaches just above the tide.', 'Crushed seed has been used as a fish poison.'),
  ('Barringtonia racemosa', 'Powder-puff tree', 'Putat', 'Lecythidaceae', 'Barringtonia', 'Small tree with hanging spikes of pink-white flowers.', 'Least Concern', 'East Africa to the Pacific', 'Tidal rivers, swamps and wet forest.', 'Planted for the night-scented flowers.'),
  ('Calophyllum inophyllum', 'Alexandrian laurel', 'Bintangor laut', 'Calophyllaceae', 'Calophyllum', 'Shore tree with glossy leaves and round nuts.', 'Least Concern', 'Tropical coasts of the Indo-Pacific', 'Sandy shores and coastal villages.', 'Seed oil has traditional uses. A common shade tree.'),
  ('Calophyllum soulattri', 'Bintangor', 'Bintangor', 'Calophyllaceae', 'Calophyllum', 'Forest tree with opposite glossy leaves and scented flowers.', 'Least Concern', 'Southeast Asia', 'Lowland and hill forest.', 'Bintangor timber and shade.'),
  ('Cratoxylum arborescens', 'Geronggang', 'Geronggang', 'Hypericaceae', 'Cratoxylum', 'Light-crowned tree of swamp and poor soils.', 'Least Concern', 'Peninsular Malaysia, Sumatra and Borneo', 'Peat swamp and secondary forest.', 'Light timber, often from swamp forest.'),
  ('Endospermum diadenum', 'Sesenduk', 'Sesenduk', 'Euphorbiaceae', 'Endospermum', 'Fast softwood tree with large round leaves.', 'Least Concern', 'Peninsular Malaysia and Sumatra', 'Secondary forest and old clearings.', 'A light timber used for matches and boxes.'),
  ('Campnosperma auriculatum', 'Terentang', 'Terentang', 'Anacardiaceae', 'Campnosperma', 'Swamp tree with leaves that clasp the twig.', 'Least Concern', 'Peninsular Malaysia, Sumatra and Borneo', 'Peat swamp and freshwater swamp forest.', 'Light swamp timber.'),
  ('Alstonia scholaris', 'Blackboard tree', 'Pulai', 'Apocynaceae', 'Alstonia', 'Tall tree with leaves in whorls and bitter white latex.', 'Least Concern', 'South and Southeast Asia to Australia', 'Secondary forest, open country and towns.', 'Light timber. Once used for school slates, hence the English name.'),
  ('Dyera polyphylla', 'Swamp jelutong', 'Jelutong paya', 'Apocynaceae', 'Dyera', 'Huge peat-swamp tree with abundant white latex.', 'Vulnerable', 'Sumatra and Borneo', 'Peat swamp forest.', 'Light carving timber. Latex was used for chewing gum.'),
  ('Palaquium obovatum', 'Nyatoh', 'Nyatoh', 'Sapotaceae', 'Palaquium', 'Forest tree with milky latex and a dense crown.', 'Least Concern', 'Southeast Asia', 'Lowland and hill forest.', 'Nyatoh timber for furniture.'),
  ('Payena leerii', 'Nyatoh payena', 'Nyatoh puteh', 'Sapotaceae', 'Payena', 'Gutta relative with a straight bole and leathery leaves.', 'Least Concern', 'Peninsular Malaysia, Sumatra and Borneo', 'Lowland forest.', 'Timber sold as nyatoh. Latex is a minor gutta.'),
  ('Macaranga tanarius', 'Parasol leaf', 'Mahang', 'Euphorbiaceae', 'Macaranga', 'Pioneer with large round leaves on long stalks.', 'Least Concern', 'Tropical Asia to Australia', 'Forest gaps, roadsides and young regrowth.', 'One of the first trees to fill a clearing.'),
  ('Macaranga triloba', 'Mahang', 'Mahang', 'Euphorbiaceae', 'Macaranga', 'Pioneer with three-lobed leaves, often with ants in the twigs.', 'Least Concern', 'Peninsular Malaysia, Sumatra and Borneo', 'Gaps and edges of lowland forest.', 'A classic ant-plant of the regrowth.'),
  ('Trema orientalis', 'Charcoal tree', 'Mengkirai', 'Cannabaceae', 'Trema', 'Fast small tree with rough leaves and tiny fruit.', 'Least Concern', 'Tropics of Africa, Asia and the Pacific', 'Clearings, landslides and roadsides.', 'Firewood and a nurse tree on bare ground.'),
  ('Mallotus paniculatus', 'Balik angin', 'Balik angin', 'Euphorbiaceae', 'Mallotus', 'Small tree; the leaf underside flashes white in the wind.', 'Least Concern', 'South and Southeast Asia', 'Secondary forest and forest edges.', 'The Malay name means turn-in-the-wind.'),
  ('Dillenia indica', 'Elephant apple', 'Simpoh', 'Dilleniaceae', 'Dillenia', 'Large white flowers and a fruit wrapped in fleshy sepals.', 'Least Concern', 'South and Southeast Asia', 'Riverbanks and open forest.', 'The sour sepals are cooked. Elephants eat the fruit.'),
  ('Elaeocarpus stipularis', 'Mendong', 'Mendong', 'Elaeocarpaceae', 'Elaeocarpus', 'Forest tree with toothed leaves and small blue fruit.', 'Least Concern', 'Peninsular Malaysia, Sumatra and Borneo', 'Lowland and hill forest.', 'Light timber. Fruit feeds birds.'),
  ('Canarium littorale', 'Kedondong', 'Kedondong', 'Burseraceae', 'Canarium', 'Forest tree with resinous bark and oily fruit.', 'Least Concern', 'Southeast Asia', 'Lowland forest.', 'Resin and a wild relative of the village kedondong.'),
  ('Dacryodes rostrata', 'Kembayau', 'Kembayau', 'Burseraceae', 'Dacryodes', 'Forest tree with dark purple olives that are blanched before eating.', 'Least Concern', 'Peninsular Malaysia and Borneo', 'Lowland forest and longhouse gardens.', 'A traditional fruit, eaten with salt after a short boil.'),
  ('Azadirachta excelsa', 'Sentang', 'Sentang', 'Meliaceae', 'Azadirachta', 'Fast mahogany relative planted for timber.', 'Least Concern', 'Peninsular Malaysia, Sumatra and Borneo', 'Lowland forest and plantations.', 'A local plantation timber, related to neem.'),
  ('Toona sureni', 'Surian', 'Surian', 'Meliaceae', 'Toona', 'Deciduous tree with a cedar scent in the bark.', 'Least Concern', 'South and Southeast Asia', 'Hill forest and villages.', 'Cabinet timber with a cedar smell.'),
  ('Melia azedarach', 'Chinaberry', 'Mindi', 'Meliaceae', 'Melia', 'Open crown, lilac flowers and yellow berries.', 'Least Concern', 'South and Southeast Asia', 'Open country, roadsides and towns.', 'Shade tree. The fruit is poisonous.'),
  ('Falcataria falcata', 'Batai', 'Batai', 'Fabaceae', 'Falcataria', 'Very fast softwood with a fine feathery crown.', 'Least Concern', 'Eastern Indonesia, planted widely in Malaysia', 'Plantations and young regrowth.', 'Pulp, matches and light boards.'),
  ('Acacia mangium', 'Mangium', 'Akasia mangium', 'Fabaceae', 'Acacia', 'Plantation wattle with broad phyllodes and pale flowers.', 'Least Concern', 'Queensland and New Guinea, planted across Malaysia', 'Plantations on poor soils.', 'Pulp and a common regrowth tree.'),
  ('Acacia auriculiformis', 'Earleaf acacia', 'Akasia kuning', 'Fabaceae', 'Acacia', 'Crooked wattle with curved phyllodes and yellow flower spikes.', 'Least Concern', 'Northern Australia and New Guinea, planted widely', 'Roadsides, mines and poor ground.', 'Firewood, shade and land rehabilitation.'),
  ('Leucaena leucocephala', 'Lead tree', 'Petai belalang', 'Fabaceae', 'Leucaena', 'Small legume tree with long flat pods.', 'Least Concern', 'Tropics worldwide', 'Roadsides, pastures and waste ground.', 'Fodder and green manure. It spreads readily.'),
  ('Erythrina variegata', 'Coral tree', 'Dedap', 'Fabaceae', 'Erythrina', 'Thorny trunk and scarlet pea flowers on bare branches.', 'Least Concern', 'Coasts of the Indo-Pacific', 'Shores and villages.', 'Living fence and a support for pepper vines.'),
  ('Gliricidia sepium', 'Quickstick', 'Gamal', 'Fabaceae', 'Gliricidia', 'Small tree that strikes easily from cuttings.', 'Least Concern', 'Planted throughout the tropics', 'Farms, hedges and cocoa shade.', 'Living stakes, fodder and shade for crops.'),
  ('Senna siamea', 'Kassod tree', 'Johar', 'Fabaceae', 'Senna', 'Yellow-flowered shade tree with a dense crown.', 'Least Concern', 'South and Southeast Asia', 'Roadsides, towns and dry open ground.', 'A common avenue and shade tree.'),
  ('Cassia javanica', 'Pink shower', 'Kasia', 'Fabaceae', 'Cassia', 'Spreading tree covered in pink flowers.', 'Least Concern', 'Southeast Asia', 'Parks, temples and open woodland.', 'Planted for the flower display.'),
  ('Saraca thaipingensis', 'Yellow saraca', 'Gapis', 'Fabaceae', 'Saraca', 'Understorey tree with yellow flowers on the trunk and branches.', 'Least Concern', 'Peninsular Malaysia', 'Stream banks in lowland forest, and widely planted.', 'A favourite garden tree, named from Taiping.'),
  ('Clitoria ternatea', 'Butterfly pea', 'Bunga telang', 'Fabaceae', 'Clitoria', 'Twining herb with deep blue pea flowers.', 'Least Concern', 'Planted throughout the tropics', 'Gardens, fences and sunny edges.', 'Flowers colour rice, drinks and kuih.'),
  ('Averrhoa carambola', 'Star fruit', 'Belimbing', 'Oxalidaceae', 'Averrhoa', 'Small tree with ridged fruit that cuts into stars.', 'Least Concern', 'Cultivated across tropical Asia', 'Home gardens and orchards.', 'A common market fruit, eaten fresh or juiced.'),
  ('Averrhoa bilimbi', 'Bilimbi', 'Belimbing buluh', 'Oxalidaceae', 'Averrhoa', 'Sour green fruit clustered on the trunk and branches.', 'Least Concern', 'Cultivated across tropical Asia', 'House yards.', 'The sour fruit goes into sambal and pickles.'),
  ('Carica papaya', 'Papaya', 'Betik', 'Caricaceae', 'Carica', 'Soft unbranched stem with a crown of lobed leaves and large fruit.', 'Least Concern', 'Planted throughout the tropics', 'Gardens and smallholdings.', 'Fruit is eaten ripe and green. The sap can tenderise meat.'),
  ('Musa balbisiana', 'Wild banana', 'Pisang batu', 'Musaceae', 'Musa', 'Seeded banana with a tall false stem and upright fruit.', 'Least Concern', 'South and Southeast Asia', 'Forest edges, rivers and villages.', 'A wild parent of many cooking bananas.'),
  ('Citrus aurantiifolia', 'Key lime', 'Limau nipis', 'Rutaceae', 'Citrus', 'Thorny small tree with thin-skinned sour limes.', 'Least Concern', 'Cultivated across the tropics', 'Home gardens.', 'Juice for drinks, sambal and marinades.'),
  ('Citrus maxima', 'Pomelo', 'Limau bali', 'Rutaceae', 'Citrus', 'The largest citrus, with a thick rind and sweet segments.', 'Least Concern', 'Cultivated across Southeast Asia', 'Orchards and villages.', 'A festival and market fruit.'),
  ('Murraya koenigii', 'Curry leaf', 'Daun kari', 'Rutaceae', 'Murraya', 'Small aromatic tree; the leaflets scent fried dishes.', 'Least Concern', 'South and Southeast Asia', 'Gardens and dry open woodland.', 'The leaf is a kitchen herb.'),
  ('Murraya paniculata', 'Orange jasmine', 'Kemuning', 'Rutaceae', 'Murraya', 'Neat shrub with glossy leaves and fragrant white flowers.', 'Least Concern', 'South and Southeast Asia to Australia', 'Forest edges and hedges.', 'A standard scented hedge plant.'),
  ('Garcinia parvifolia', 'Kandis', 'Kandis', 'Clusiaceae', 'Garcinia', 'Forest tree with small sour yellow fruit.', 'Least Concern', 'Peninsular Malaysia, Sumatra and Borneo', 'Lowland forest and villages.', 'Dried slices sour curries, as a wild asam.'),
  ('Baccaurea macrocarpa', 'Tampoi', 'Tampoi', 'Phyllanthaceae', 'Baccaurea', 'Forest tree with large brown fruit hanging from the trunk.', 'Least Concern', 'Peninsular Malaysia and Borneo', 'Lowland forest.', 'The sweet pulp is a traditional forest fruit.'),
  ('Durio kutejensis', 'Orange durian', 'Durian kuning', 'Malvaceae', 'Durio', 'Wild durian with orange flesh and a milder smell.', 'Near Threatened', 'Borneo', 'Lowland forest and village orchards.', 'Eaten fresh. Less pungent than the common durian.'),
  ('Mangifera caesia', 'Binjai', 'Binjai', 'Anacardiaceae', 'Mangifera', 'Tall wild mango with pale fragrant flesh.', 'Near Threatened', 'Peninsular Malaysia, Sumatra and Borneo', 'Lowland forest and old villages.', 'Eaten fresh or in sambal. Wild trees are declining.'),
  ('Artocarpus elasticus', 'Terap', 'Terap', 'Moraceae', 'Artocarpus', 'Forest tree with a sweet compound fruit and bark cloth fibre.', 'Least Concern', 'Peninsular Malaysia, Sumatra and Borneo', 'Lowland forest.', 'Fruit is eaten. The bark has been beaten into cloth.'),
  ('Artocarpus lanceifolius', 'Keledang', 'Keledang', 'Moraceae', 'Artocarpus', 'Tall forest tree with a heavy durable wood.', 'Least Concern', 'Peninsular Malaysia, Sumatra and Borneo', 'Lowland and hill forest.', 'Keledang is a hard timber for flooring.'),
  ('Flacourtia rukam', 'Rukam', 'Rukam', 'Salicaceae', 'Flacourtia', 'Thorny small tree with sour red fruit.', 'Least Concern', 'Southeast Asia', 'Forest edges and villages.', 'Fruit is eaten after rubbing, which sweetens it.'),
  ('Phyllanthus acidus', 'Star gooseberry', 'Cermai', 'Phyllanthaceae', 'Phyllanthus', 'Small tree with pale sour fruit along the twigs.', 'Least Concern', 'Cultivated across tropical Asia', 'House gardens.', 'Fruit is cooked with sugar or pickled.'),
  ('Syzygium cumini', 'Java plum', 'Jambul', 'Myrtaceae', 'Syzygium', 'Dense crown and dark purple astringent fruit.', 'Least Concern', 'South and Southeast Asia', 'Riverbanks, parks and villages.', 'Fruit is eaten. The tree is also planted for shade.'),
  ('Syzygium polyanthum', 'Indonesian bay', 'Salam', 'Myrtaceae', 'Syzygium', 'Evergreen whose dried leaves flavour stews.', 'Least Concern', 'Peninsular Malaysia to Indonesia', 'Lowland forest and kitchen gardens.', 'The leaf is a standard spice, called daun salam.'),
  ('Syzygium jambos', 'Rose apple', 'Jambu mawar', 'Myrtaceae', 'Syzygium', 'Small tree with crisp fruit that smells of rose.', 'Least Concern', 'Planted across the tropics', 'Gardens and wet ground.', 'A home-garden fruit, eaten fresh.'),
  ('Coffea canephora', 'Robusta coffee', 'Kopi', 'Rubiaceae', 'Coffea', 'Understorey shrub with red cherries, each holding two seeds.', 'Least Concern', 'Planted in the humid tropics', 'Shade gardens and smallholdings.', 'The usual coffee of lowland Malaysia.'),
  ('Mussaenda philippica', 'Bangkok rose', 'Janda kaya', 'Rubiaceae', 'Mussaenda', 'Shrub with one enlarged white or pink sepal on each flower head.', 'Least Concern', 'Planted throughout the tropics', 'Sunny hedges and parks.', 'A common ornamental shrub.'),
  ('Gardenia jasminoides', 'Gardenia', 'Bunga cina', 'Rubiaceae', 'Gardenia', 'Shrub with glossy leaves and heavily scented white flowers.', 'Least Concern', 'Planted across tropical and subtropical Asia', 'Courtyards and hedges.', 'Flowers for perfume and garlands.'),
  ('Piper nigrum', 'Black pepper', 'Lada hitam', 'Piperaceae', 'Piper', 'Climbing vine; the spice is the dried unripe fruit.', 'Least Concern', 'Native to the Western Ghats, long planted in Malaysia', 'Poles and smallholdings in a wet climate.', 'A historic Malay spice crop.'),
  ('Piper sarmentosum', 'Wild pepper', 'Kaduk', 'Piperaceae', 'Piper', 'Low herb with heart-shaped aromatic leaves.', 'Least Concern', 'Southeast Asia', 'Damp shade, village edges and forest margins.', 'Leaves wrap food and go into ulam.'),
  ('Zingiber officinale', 'Ginger', 'Halia', 'Zingiberaceae', 'Zingiber', 'Aromatic rhizome with narrow leaves and a yellow flower spike.', 'Least Concern', 'Cultivated across tropical Asia', 'Gardens and spice beds.', 'A daily kitchen spice and a folk remedy.'),
  ('Curcuma longa', 'Turmeric', 'Kunyit', 'Zingiberaceae', 'Curcuma', 'Leafy herb; the cut rhizome is deep orange.', 'Least Concern', 'Cultivated across tropical Asia', 'Gardens and small farms.', 'Colour and spice for rice, curries and medicine.'),
  ('Alpinia galanga', 'Galangal', 'Lengkuas', 'Zingiberaceae', 'Alpinia', 'Tall ginger with a pale aromatic rhizome.', 'Least Concern', 'Southeast Asia', 'Gardens and damp forest edges.', 'Essential in rendang and many spice pastes.'),
  ('Boesenbergia rotunda', 'Fingerroot', 'Temu kunci', 'Zingiberaceae', 'Boesenbergia', 'Low herb with finger-like aromatic roots.', 'Least Concern', 'Southeast Asia', 'Shade gardens and forest margins.', 'A common rhizome in sambal and kerabu.'),
  ('Kaempferia galanga', 'Aromatic ginger', 'Cekur', 'Zingiberaceae', 'Kaempferia', 'Ground-hugging herb with round leaves and a camphor-scented rhizome.', 'Least Concern', 'Tropical Asia', 'Village gardens.', 'Leaves and rhizome flavour rice and fish.'),
  ('Elettaria cardamomum', 'Cardamom', 'Pelaga', 'Zingiberaceae', 'Elettaria', 'Clump of aromatic leaves with pods near the ground.', 'Least Concern', 'Native to southern India, planted in the tropics', 'Shade gardens.', 'The pod is a spice for drinks and sweets.'),
  ('Metroxylon sagu', 'Sago palm', 'Rumbia', 'Arecaceae', 'Metroxylon', 'Clump palm; the trunk is full of starch before it flowers.', 'Least Concern', 'Eastern Indonesia to New Guinea, planted in Malaysia', 'Freshwater swamps and village plots.', 'Sago starch is a staple. Leaves are used for thatch.'),
  ('Caryota mitis', 'Fishtail palm', 'Rabok', 'Arecaceae', 'Caryota', 'Clustering palm with leaflets shaped like fish tails.', 'Least Concern', 'Southeast Asia', 'Understorey of lowland forest, and gardens.', 'Ornamental. The fruit sap can irritate skin.'),
  ('Johannesteijsmannia altifrons', 'Joey palm', 'Daun payung', 'Arecaceae', 'Johannesteijsmannia', 'Stemless palm with a few huge diamond-shaped leaves.', 'Near Threatened', 'Southern Thailand and Peninsular Malaysia', 'Shady lowland forest on damp slopes.', 'Leaves were used as umbrellas, hence the Malay name. Collected for the horticultural trade.'),
  ('Eugeissona tristis', 'Bertam', 'Bertam', 'Arecaceae', 'Eugeissona', 'Spiny clustering palm that can form dense thickets.', 'Least Concern', 'Peninsular Malaysia', 'Hill forest, often on ridges.', 'Leaves for thatch. The thickets are hard to walk through.'),
  ('Calamus caesius', 'Sega rattan', 'Rotan sega', 'Arecaceae', 'Calamus', 'Slender climbing palm with a good flexible cane.', 'Least Concern', 'Peninsular Malaysia, Sumatra and Borneo', 'Lowland forest, climbing into the canopy.', 'A fine furniture rattan, thinner than manau.'),
  ('Borassodendron machadonis', 'Bindang', 'Bindang', 'Arecaceae', 'Borassodendron', 'Tall fan palm of the forest understorey.', 'Vulnerable', 'Southern Thailand and Peninsular Malaysia', 'Lowland and hill forest.', 'A notable native palm. Large plants are uncommon.'),
  ('Cycas rumphii', 'Queen sago', 'Paku laut', 'Cycadaceae', 'Cycas', 'Palm-like cycad with a stout trunk and stiff fronds.', 'Near Threatened', 'Coasts of Southeast Asia to the Pacific', 'Sandy and rocky shores.', 'An ancient shoreline plant. Seeds are poisonous unless carefully processed.'),
  ('Podocarpus polystachyus', 'Sea teak', 'Jati laut', 'Podocarpaceae', 'Podocarpus', 'Coastal conifer with narrow leaves and a fleshy fruit stalk.', 'Vulnerable', 'Coasts of Peninsular Malaysia, Sumatra and Borneo', 'Rocky and sandy shores, and limestone.', 'A shore conifer. Habitat has been lost to coastal development.'),
  ('Dacrydium beccarii', 'Ekor tupai', 'Ekor tupai', 'Podocarpaceae', 'Dacrydium', 'Conifer with fine hanging shoots like a squirrel tail.', 'Least Concern', 'Malesia', 'Hill and montane forest, and some poor lowland soils.', 'The Malay name means squirrel tail.'),
  ('Platycerium coronarium', 'Staghorn fern', 'Paku tanduk rusa', 'Polypodiaceae', 'Platycerium', 'Large epiphyte with forked fertile fronds and a basket of sterile fronds.', 'Least Concern', 'Southeast Asia', 'High on trees in open forest and in towns.', 'A familiar fern on roadside trees.'),
  ('Dicranopteris linearis', 'Resam', 'Resam', 'Gleicheniaceae', 'Dicranopteris', 'Scrambling fern that blankets open banks.', 'Least Concern', 'Tropics of Asia and the Pacific', 'Road cuttings, landslides and poor open ground.', 'A pioneer that holds bare soil. Thickets are hard to cross.'),
  ('Nephrolepis biserrata', 'Sword fern', 'Paku larat', 'Nephrolepidaceae', 'Nephrolepis', 'Tufted fern with long once-divided fronds.', 'Least Concern', 'Tropics worldwide', 'Damp ground, plantations and forest edges.', 'A common ground fern, also grown in pots.'),
  ('Arundina graminifolia', 'Bamboo orchid', 'Orkid buluh', 'Orchidaceae', 'Arundina', 'Tall terrestrial orchid with grass-like leaves and pink flowers.', 'Least Concern', 'South and Southeast Asia', 'Open banks, roadsides and rocky ground.', 'A common wild orchid of sunny cuttings.'),
  ('Spathoglottis plicata', 'Philippine ground orchid', 'Orkid tanah', 'Orchidaceae', 'Spathoglottis', 'Ground orchid with pleated leaves and purple flowers.', 'Least Concern', 'Southeast Asia to the Pacific', 'Open grassy ground and gardens.', 'Widely planted and also wild on poor soils.');

do $$
declare
  v_owner uuid;
  v_species_sql text;
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
      from seed_species c
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
    from seed_species c
    where not exists (
      select 1 from public.species s
      where lower(s.scientific_name) = lower(c.scientific_name)
    );
  end if;
end $$;

commit;

select count(*) as species_count from public.species;
