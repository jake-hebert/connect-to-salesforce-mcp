#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { execSync } from "child_process";
import { promisify } from "util";
import { exec } from "child_process";

const execAsync = promisify(exec);

// Read configuration from environment variables
const INSTANCE_URL =
  process.env.SALESFORCE_INSTANCE_URL || "https://login.salesforce.com";
const ORG_ALIAS = process.env.SALESFORCE_ORG_ALIAS || "mcp-server-connect";

/**
 * Check if Salesforce CLI is installed
 */
async function checkSalesforceCLI() {
  try {
    const { stdout } = await execAsync("sf --version");
    return {
      installed: true,
      version: stdout.trim(),
    };
  } catch (error) {
    return {
      installed: false,
      version: null,
    };
  }
}

/**
 * Install Salesforce CLI
 */
async function installSalesforceCLI() {
  try {
    // Install via npm
    execSync("npm install -g @salesforce/cli", {
      stdio: "pipe",
      encoding: "utf-8",
    });

    // Verify installation
    const check = await checkSalesforceCLI();
    return {
      success: check.installed,
      version: check.version,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Login to Salesforce org
 */
async function loginToSalesforce() {
  try {
    // Run the login command - this will open a browser window
    // Suppress stdout to avoid CLI warnings interfering with MCP protocol
    const command =
      process.platform === "win32"
        ? `sf org login web --instance-url ${INSTANCE_URL} --alias ${ORG_ALIAS} --set-default > nul 2>&1`
        : `sf org login web --instance-url ${INSTANCE_URL} --alias ${ORG_ALIAS} --set-default > /dev/null 2>&1`;

    console.error("DEBUG: Running command:", command);

    execSync(command, {
      encoding: "utf-8",
    });

    console.error("DEBUG: Login command completed successfully");

    return {
      success: true,
      alias: ORG_ALIAS,
    };
  } catch (error) {
    console.error("DEBUG: Error caught:", error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Verify Salesforce connection
 */
async function verifySalesforceConnection() {
  try {
    // Suppress stderr warnings by redirecting to null
    const command =
      process.platform === "win32"
        ? `sf org display --target-org ${ORG_ALIAS} --json 2>nul`
        : `sf org display --target-org ${ORG_ALIAS} --json 2>/dev/null`;

    const { stdout } = await execAsync(command);

    console.error("DEBUG: Raw stdout from verify:", stdout);

    // Strip any non-JSON content (like warnings) before the actual JSON
    // Find the first { or [ character which indicates JSON start
    const jsonStart = stdout.search(/[{\[]/);
    const cleanJson = jsonStart >= 0 ? stdout.substring(jsonStart) : stdout;

    console.error("DEBUG: Cleaned JSON:", cleanJson);

    let result;
    try {
      result = JSON.parse(cleanJson.trim());
    } catch (parseError) {
      console.error("DEBUG: JSON parse error:", parseError.message);
      return {
        success: false,
        error: `Failed to parse Salesforce CLI output: ${parseError.message}`,
      };
    }

    if (result.status === 0 && result.result.connectedStatus === "Connected") {
      return {
        success: true,
        username: result.result.username,
        instanceUrl: result.result.instanceUrl,
        orgId: result.result.id,
      };
    } else {
      return {
        success: false,
        error: "Organization not connected",
      };
    }
  } catch (error) {
    console.error("DEBUG: Verify connection error:", error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Main setup function
 */
async function setupSalesforceConnection() {
  const results = {
    steps: [],
    success: false,
  };

  // Step 1: Check for existing SF CLI installation
  results.steps.push({
    step: 1,
    name: "Checking for Salesforce CLI",
    status: "running",
  });

  const cliCheck = await checkSalesforceCLI();

  if (cliCheck.installed) {
    results.steps[0].status = "complete";
    results.steps[0].message = `Salesforce CLI already installed (${cliCheck.version})`;
  } else {
    results.steps[0].status = "complete";
    results.steps[0].message = "Salesforce CLI not found, will install";

    // Step 2: Install SF CLI
    results.steps.push({
      step: 2,
      name: "Installing Salesforce CLI",
      status: "running",
    });

    const installation = await installSalesforceCLI();

    if (installation.success) {
      results.steps[1].status = "complete";
      results.steps[1].message = `Salesforce CLI installed successfully (${installation.version})`;
    } else {
      results.steps[1].status = "failed";
      results.steps[1].message = `Failed to install Salesforce CLI: ${installation.error}`;
      results.success = false;
      return results;
    }
  }

  // Step 3: Login to Salesforce
  const loginStepIndex = results.steps.length;
  results.steps.push({
    step: loginStepIndex + 1,
    name: "Connecting to Salesforce",
    status: "running",
  });

  const login = await loginToSalesforce();

  if (login.success) {
    results.steps[loginStepIndex].status = "complete";
    results.steps[
      loginStepIndex
    ].message = `Successfully authenticated with alias '${login.alias}'`;
  } else {
    results.steps[loginStepIndex].status = "failed";
    results.steps[
      loginStepIndex
    ].message = `Failed to authenticate: ${login.error}`;
    results.success = false;
    return results;
  }

  // Step 4: Verify connection
  const verifyStepIndex = results.steps.length;
  results.steps.push({
    step: verifyStepIndex + 1,
    name: "Verifying connection",
    status: "running",
  });

  const verification = await verifySalesforceConnection();

  if (verification.success) {
    results.steps[verifyStepIndex].status = "complete";
    results.steps[
      verifyStepIndex
    ].message = `Connection verified! Logged in as ${verification.username}`;
    results.connectionDetails = {
      username: verification.username,
      instanceUrl: verification.instanceUrl,
      orgId: verification.orgId,
      alias: ORG_ALIAS,
    };
    results.success = true;
  } else {
    results.steps[verifyStepIndex].status = "failed";
    results.steps[
      verifyStepIndex
    ].message = `Failed to verify connection: ${verification.error}`;
    results.success = false;
    return results;
  }

  return results;
}

// Create MCP server
const server = new Server(
  {
    name: "connect-to-salesforce",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "setup_salesforce_connection",
        description:
          "Set up Salesforce connection for Claude Desktop. This will: 1) Check for Salesforce CLI, 2) Install if needed, 3) Open browser for login, 4) Verify connection, 5) Provide restart instructions.",
        inputSchema: {
          type: "object",
          properties: {},
          required: [],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "setup_salesforce_connection") {
    const results = await setupSalesforceConnection();

    // Format user-friendly response
    let response = "🚀 **Salesforce Connection Setup**\n\n";

    // Show each step
    for (const step of results.steps) {
      const icon =
        step.status === "complete"
          ? "✅"
          : step.status === "failed"
          ? "❌"
          : "⏳";
      response += `${icon} **Step ${step.step}: ${step.name}**\n`;
      response += `   ${step.message}\n\n`;
    }

    if (results.success) {
      response += "\n🎉 **Setup Complete!**\n\n";
      response += `Connected as: ${results.connectionDetails.username}\n`;
      response += `Organization: ${results.connectionDetails.orgId}\n`;
      response += `Alias: ${results.connectionDetails.alias}\n\n`;
      response +=
        "⚠️ **IMPORTANT: Please completely close and reopen Claude Desktop to activate your Salesforce connection.**\n\n";
      response += "How to restart:\n";
      response += "- **Mac**: Cmd+Q to quit, then reopen\n";
      response +=
        "- **Windows**: Right-click taskbar icon → Close, then reopen\n";
      response += "- **Linux**: Quit from menu, then reopen\n\n";
      response +=
        "After restarting, you'll be able to ask me questions about your Salesforce data!";
    } else {
      response += "\n❌ **Setup Failed**\n\n";
      response +=
        "Please contact your IT administrator for assistance or try running the setup again.";
    }

    return {
      content: [
        {
          type: "text",
          text: response,
        },
      ],
    };
  }

  throw new Error(`Unknown tool: ${request.params.name}`);
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
