import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// The workspace root is one level up from the scripts folder
const rootDir = path.resolve(__dirname, "..");
const featuresDir = path.join(rootDir, "apps", "web", "src", "features");

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function kebabToCamel(str) {
  return str.replace(/-./g, (x) => x[1].toUpperCase());
}

function kebabToPascal(str) {
  return capitalize(kebabToCamel(str));
}

const moduleName = process.argv[2];

if (!moduleName) {
  console.error("❌ Please provide a feature module name. Example: node scripts/generate-module.js tickets");
  process.exit(1);
}

const pascalName = kebabToPascal(moduleName);
const camelName = kebabToCamel(moduleName);

const targetDir = path.join(featuresDir, moduleName);

if (fs.existsSync(targetDir)) {
  console.error(`❌ Module "${moduleName}" already exists at ${targetDir}`);
  process.exit(1);
}

console.log(`🚀 Scaffolding new CampusCare feature module: "${moduleName}"...`);

// 1. Create directory tree
const subdirs = ["api", "components", "hooks", "pages", "schemas", "types", "utils"];
subdirs.forEach((sub) => {
  fs.mkdirSync(path.join(targetDir, sub), { recursive: true });
});

// 2. Create index.ts
const indexContent = `// Feature entrypoint — exposes public contracts only
export { ${pascalName}Page } from "./pages/${pascalName}Page.js";
export { use${pascalName} } from "./hooks/use${pascalName}.js";
`;
fs.writeFileSync(path.join(targetDir, "index.ts"), indexContent);

// 3. Create pages/[FeatureName]Page.tsx
const pageContent = `import React from "react";
import { PageHeader } from "@/components/common/PageHeader.js";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card.js";
import { use${pascalName} } from "../hooks/use${pascalName}.js";

export function ${pascalName}Page() {
  const { data, isLoading } = use${pascalName}();

  return (
    <div className="space-y-6">
      <PageHeader
        title="${pascalName} Management"
        description="Administer and track ${moduleName} operations across campus."
      />

      <Card>
        <CardHeader>
          <CardTitle>Overview</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-xs text-muted-foreground">Loading feature workspace...</p>
          ) : (
            <p className="text-sm">Welcome to the ${pascalName} Workspace.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
`;
fs.writeFileSync(path.join(targetDir, "pages", `${pascalName}Page.tsx`), pageContent);

// 4. Create api/[featureName].api.ts
const apiContent = `import { sdkRequest } from "@/lib/api-sdk.js";
import { isMockEnabled } from "@/mocks/index.js";

// Mock resolver simulates server load
const mockResolver = async (): Promise<any> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ status: "success", data: [] });
    }, 450);
  });
};

export const ${camelName}Api = {
  list: async (filters?: any): Promise<any> => {
    return sdkRequest<any>({
      method: "GET",
      url: "/${moduleName}",
      params: filters,
      mockResolver,
    });
  },
};
`;
fs.writeFileSync(path.join(targetDir, "api", `${moduleName}.api.ts`), apiContent);

// 5. Create hooks/use[FeatureName].ts
const hookContent = `import { useQuery } from "@tanstack/react-query";
import { ${camelName}Api } from "../api/${moduleName}.api.js";

export function use${pascalName}(filters?: any) {
  return useQuery({
    queryKey: ["${moduleName}", "list", filters || {}],
    queryFn: () => ${camelName}Api.list(filters),
  });
}
`;
fs.writeFileSync(path.join(targetDir, "hooks", `use${pascalName}.ts`), hookContent);

// 6. Create feature-scoped README.md detailing architecture rules
const readmeContent = `# ${pascalName} Module

This module governs the business logic, pages, components, and schema definitions for ${pascalName} management.

## Architecture Guidelines

1. **Named Exports Only:**
   Every component, hook, and function MUST be exported via named exports. Do not use \`export default\`.
   
2. **Absolute Path Aliases:**
   Use absolute path aliases (\`@/...\`) for imports outside this module directory.
   
3. **Decoupled Business Logic:**
   - Keep page components thin.
   - Extract async data fetching and state tracking into custom React hooks (e.g. \`use${pascalName}.ts\`).
   - Route network requests exclusively through the API module helper (\`${camelName}.api.ts\`), which uses the global \`api-sdk\` client.
   
4. **Validation:**
   Validate form variables and input payloads utilizing Zod schemas defined inside the \`schemas/\` subfolder.
`;
fs.writeFileSync(path.join(targetDir, "README.md"), readmeContent);

console.log(`✅ Module "${moduleName}" scaffolded successfully!`);
console.log(`📍 Created files at: apps/web/src/features/${moduleName}/`);
