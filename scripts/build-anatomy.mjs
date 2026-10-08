// Builds the web anatomy models for Diet Pro from Z-Anatomy (CC BY-SA 4.0,
// github.com/LluisV/Z-Anatomy; geometry derived from BodyParts3D, DBCLS, CC BY-SA 2.1 JP).
//
// One-off, run outside the app (its packages are not app dependencies):
//   mkdir /tmp/za && cd /tmp/za && npm i fbx2gltf @gltf-transform/core@4 @gltf-transform/extensions@4 @gltf-transform/functions@4 meshoptimizer
//   for f in MuscularSystem100 SkeletalSystem100 "Regions of human body100"; do curl -LO "https://raw.githubusercontent.com/LluisV/Z-Anatomy/PC-Version/Resources/Models/FBX/${f// /%20}.fbx"; done
//   node_modules/fbx2gltf/bin/Linux/FBX2glTF --binary --input MuscularSystem100.fbx --output muscles   (same for skeleton, regions)
//   node <repo>/scripts/build-anatomy.mjs /tmp/za <repo>/public/anatomy
import path from "node:path";
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS, EXTMeshoptCompression } from "@gltf-transform/extensions";
import { dedup, flatten, join, prune, quantize, simplify, weld } from "@gltf-transform/functions";
import { MeshoptEncoder, MeshoptSimplifier } from "meshoptimizer";

await MeshoptSimplifier.ready;
await MeshoptEncoder.ready;
const [srcDir, outDir] = process.argv.slice(2);

// Muscle group (matches the Diet Pro training split) → Z-Anatomy object names.
const GROUPS = [
  ["chest", /pectoralis major/i],
  ["shoulders", /deltoid muscle|supraspinatus/i],
  ["biceps", /biceps brachii|brachialis|coracobrachialis/i],
  ["triceps", /triceps brachii|anconeus/i],
  ["forearms", /brachioradialis|carpi|digitorum superficialis|palmaris longus|pronator teres|extensor digitorum muscle|extensor digiti minimi|abductor pollicis longus|extensor pollicis/i],
  ["back", /latissimus|trapezius|teres major|teres minor|infraspinatus|rhomboid|levator scapulae|iliocostalis|longissimus thoracis|splenius/i],
  ["core", /rectus abdominis|external abdominal oblique|serratus anterior/i],
  ["glutes", /gluteus maximus|gluteus medius|tensor fasciae/i],
  ["quads", /rectus femoris|vastus|sartorius/i],
  ["adductors", /adductor longus|adductor magnus|gracilis|pectineus/i],
  ["hamstrings", /biceps femoris|semitendinosus|semimembranosus/i],
  ["calves", /gastrocnemius|soleus|tibialis anterior|fibularis longus|fibularis brevis|extensor digitorum longus/i],
  ["neck", /sternocleidomastoid|platysma/i],
];
const BONES = /skull|cranium|mandible|frontal bone|parietal bone|occipital bone|temporal bone|zygomatic|maxilla|nasal bone|vertebra|sacrum|coccyx|\brib\b|sternum|clavicle|scapula|humerus|radius|ulna|hip bone|femur|patella|tibia|fibula|carpal|metacarp|phalan|tarsal|metatars|calcaneus|talus|costal cartilage/i;
const SKIP = /tendon sheath|fascia|retinaculum/i;
// Z-Anatomy suffixes: .l / .r = left / right, none = midline. Other suffixes (.j, .i, .ol, .or,
// .el, .er) are labels, guide lines and grouping helpers, not anatomy — drop them.
const isReal = (name) => !/\.[a-z]+$/i.test(name) || /\.(l|r)$/.test(name);

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ "meshopt.encoder": MeshoptEncoder });

async function build(src, out, pick, { ratio, error, joinAll }) {
  const doc = await io.read(path.join(srcDir, src));
  const root = doc.getRoot();
  const counts = {};
  for (const n of root.listNodes()) {
    if (!n.getMesh()) continue;
    const name = n.getName();
    const base = name.replace(/\.(l|r|j)$/, "");
    const group = !isReal(name) || SKIP.test(base) ? null : pick(base);
    if (!group) {
      n.setMesh(null);
      continue;
    }
    n.setExtras({ group, label: base, side: name.endsWith(".l") ? "left" : name.endsWith(".r") ? "right" : "" });
    counts[group] = (counts[group] ?? 0) + 1;
  }
  for (const m of root.listMaterials()) m.dispose();
  await doc.transform(prune(), dedup(), flatten(), weld({ tolerance: 0.0001 }), simplify({ simplifier: MeshoptSimplifier, ratio, error }));
  if (joinAll) await doc.transform(join({ keepNamed: false }));
  // Normals are recomputed in the browser; drop everything but positions.
  for (const p of root.listMeshes().flatMap((m) => m.listPrimitives())) for (const s of p.listSemantics()) if (s !== "POSITION") p.setAttribute(s, null);
  await doc.transform(prune(), quantize({ quantizePosition: 14 }));
  doc.createExtension(EXTMeshoptCompression).setRequired(true).setEncoderOptions({ method: EXTMeshoptCompression.EncoderMethod.FILTER });
  await io.write(path.join(outDir, out), doc);
  const tris = root.listMeshes().flatMap((m) => m.listPrimitives()).reduce((s, p) => s + p.getIndices().getCount() / 3, 0);
  console.log(out, JSON.stringify(counts), "triangles", tris);
}

await build("muscles.glb", "muscles.glb", (b) => GROUPS.find(([, re]) => re.test(b))?.[0] ?? null, { ratio: 0.22, error: 0.0008 });
await build("skeleton.glb", "bones.glb", (b) => (BONES.test(b) ? "bone" : null), { ratio: 0.04, error: 0.004, joinAll: true });
// The skin leaves out the external genitalia (urogenital/anal regions, pubic hair): the viewer
// dresses the pelvis in body-fitted shorts instead.
await build("regions.glb", "skin.glb", (b) => (/urogenital|anal region|pubic hair/i.test(b) ? null : "skin"), { ratio: 0.5, error: 0.0008, joinAll: true });
