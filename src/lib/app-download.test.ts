import { describe, expect, it } from "vitest";
import { ANDROID_PACKAGE, assetLinks, certFingerprints } from "./app-download";

const FP = "E8:34:D7:0B:F9:84:CB:68:89:EC:19:7C:E5:AB:43:5B:C0:7A:21:2C:64:33:F7:01:10:4E:DC:D4:92:42:6E:3A";

describe("certFingerprints", () => {
  it("reads, normalises and de-duplicates the env list", () => {
    expect(certFingerprints(`${FP.toLowerCase()}, ${FP}`)).toEqual([FP]);
  });
  it("drops anything that isn't a SHA-256 fingerprint", () => {
    expect(certFingerprints("abc, E8:34")).toEqual([]);
    expect(certFingerprints(undefined)).toEqual([]);
  });
});

describe("assetLinks", () => {
  it("is empty until a key is known", () => {
    expect(assetLinks([])).toEqual([]);
  });
  it("names the app package and its key", () => {
    const [s] = assetLinks([FP]);
    expect(s.relation).toEqual(["delegate_permission/common.handle_all_urls"]);
    expect(s.target).toEqual({ namespace: "android_app", package_name: ANDROID_PACKAGE, sha256_cert_fingerprints: [FP] });
  });
});
