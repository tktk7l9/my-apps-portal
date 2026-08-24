import { describe, expect, it } from "vitest";
import { packageMeta, rawProjects, serviceUrls } from "@/lib/projects";

describe("カタログと参照表の整合", () => {
  it("trackedPackages はすべて packageMeta に登録されている", () => {
    for (const project of rawProjects) {
      for (const name of project.trackedPackages) {
        expect(packageMeta[name], `${project.id} の ${name} が packageMeta に無い`).toBeDefined();
      }
    }
  });

  it("services はすべて serviceUrls に登録されている", () => {
    for (const project of rawProjects) {
      for (const name of project.services) {
        expect(serviceUrls[name], `${project.id} の ${name} が serviceUrls に無い`).toBeDefined();
      }
    }
  });
});
