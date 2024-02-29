const env = process.env.USE_OVERLAY || "";
const restrictImageVersions = (process.env.RESTRICT_IMAGE_VERSION || "")
  .split(",")
  .map((i) => i.trim().split(":"))
  .filter((i) => i.length === 2)
  .reduce((obj, image) => ({ ...obj, [image[0]]: image[1] }), {});
const onlyUpdateRestrictedImages =
  process.env.ONLY_RESTRICTED_IMAGES === "true";

const allowedEnvs = ["dev", "test", "stage", "prod"];

if (allowedEnvs.indexOf(env) === -1) {
  console.log(
    `ENV should be one of: ${allowedEnvs.join(", ")}. Was: "${env}".`
  );
  process.exit(1);
}

if (Object.keys(restrictImageVersions).length > 0) {
  if (onlyUpdateRestrictedImages) {
    console.log(
      "Only the following images will be updated, and they will be limited to the following versions:"
    );
  } else {
    console.log(
      "All images will be updated to latest, except these, which will be limited to the following versions:"
    );
  }
  Object.keys(restrictImageVersions).forEach((image) =>
    console.log(`  - ${image}:${restrictImageVersions[image]}`)
  );
} else if (onlyUpdateRestrictedImages) {
  console.log(
    "RESTRICT_IMAGE_VERSION should be provided if ONLY_RESTRICTED_IMAGES is set to true."
  );
  process.exit(1);
}

const packageRules = [
  {
    matchPackagePatterns: ["*"],
    enabled: false,
  },
];

Object.keys(restrictImageVersions).forEach((image) => {
  packageRules.push({
    matchFileNames: [`overlays/${env}/kustomization.yaml`],
    enabled: true,
    matchPackageNames: [image],
    allowedVersions: `<=${restrictImageVersions[image]}`,
  });
});

if (!onlyUpdateRestrictedImages) {
  packageRules.push({
    matchFileNames: [`overlays/${env}/kustomization.yaml`],
    matchPackagePatterns: ["*"],
    enabled: true,
  });
}

const config = {
  extends: ["config:recommended"],
  dependencyDashboard: false,
  platform: "github",
  packageRules,
  prHourlyLimit: 0,
  prConcurrentLimit: 0,
  prBodyTemplate: "{{{header}}}{{{table}}}{{{warnings}}}{{{notes}}}{{{changelogs}}}{{{footer}}}",
};

console.log("Using config:");
console.log(JSON.stringify(config));

module.exports = config;
