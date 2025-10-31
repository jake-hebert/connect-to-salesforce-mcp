# Salesforce CLI Connect MCP

A Model Context Protocol (MCP) server that provides a user-friendly setup wizard for connecting Claude Desktop to Salesforce via the Salesforce CLI.

## Overview

This MCP server acts as a setup assistant that guides non-technical users through connecting to Salesforce. It handles:

1. ✅ Checking for Salesforce CLI installation
2. ✅ Installing Salesforce CLI if needed
3. ✅ Opening browser for secure OAuth authentication
4. ✅ Verifying the connection
5. ✅ Providing clear restart instructions

No technical knowledge required - users simply ask Claude to "Help me connect to Salesforce" and the setup wizard guides them through the entire process.

## Features

- **Automatic Installation**: Installs Salesforce CLI if not already present
- **Browser-Based Login**: Secure OAuth flow through your default browser
- **No Plain-Text Credentials**: All credentials stored securely via Salesforce CLI
- **Individual User Authentication**: Each user authenticates with their own Salesforce account
- **Configurable**: Supports any Salesforce instance URL
- **Cross-Platform**: Works on Windows, macOS, and Linux

## For IT Administrators

### Quick Start

1. **Install the package globally (optional)**:

```bash
   npm install -g @digitalRupix/connect-to-salesforce-mcp
```

2. **Deploy the Claude Desktop configuration** to users' machines at:

   - **Mac**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
   - **Linux**: `~/.config/Claude/claude_desktop_config.json`

3. **Configuration file**:

```json
{
  "mcpServers": {
    "connect-to-salesforce": {
      "command": "npx",
      "args": ["-y", "@digitalRupix/connect-to-salesforce-mcp"],
      "env": {
        "SALESFORCE_INSTANCE_URL": "https://your-org.my.salesforce.com",
        "SALESFORCE_ORG_ALIAS": "mcp-server-connect"
      }
    },
    "salesforce": {
      "command": "npx",
      "args": ["-y", "@tsmztech/mcp-server-salesforce"],
      "env": {
        "SALESFORCE_CONNECTION_TYPE": "Salesforce_CLI",
        "SALESFORCE_INSTANCE_URL": "https://your-org.my.salesforce.com"
      }
    }
  }
}
```

4. **Instruct users** to:
   - Open Claude Desktop
   - Type: "Help me set up Salesforce" or "Connect to Salesforce"
   - Follow the on-screen instructions
   - Restart Claude Desktop when prompted

That's it! No manual CLI commands or config file editing required by end users.

### Configuration Options

| Environment Variable      | Required | Default                        | Description                     |
| ------------------------- | -------- | ------------------------------ | ------------------------------- |
| `SALESFORCE_INSTANCE_URL` | Yes      | `https://login.salesforce.com` | Your Salesforce instance URL    |
| `SALESFORCE_ORG_ALIAS`    | No       | `mcp-server-connect`           | Alias for the authenticated org |

### Important Notes

- Both MCP servers (connect-to-salesforce and salesforce) should use the **same** `SALESFORCE_INSTANCE_URL`
- The org alias must match between the setup MCP and the Salesforce MCP configuration
- Users need Node.js and npm installed on their machines

## For End Users

### Setup Instructions

1. Open Claude Desktop
2. Ask Claude: **"Help me set up Salesforce"** or **"Connect to Salesforce"**
3. Claude will guide you through the setup process
4. A browser window will open for you to log in to Salesforce
5. After successful login, completely close and reopen Claude Desktop
6. You're ready to use Salesforce with Claude!

### What Gets Installed

- **Salesforce CLI**: A command-line tool that securely stores your Salesforce credentials
- **Org Connection**: Your connection is saved with the alias `mcp-server-connect` (or custom alias set by IT)

### How to Restart Claude Desktop

- **Mac**: Press `Cmd+Q` to quit, then reopen Claude Desktop
- **Windows**: Right-click the Claude icon in the taskbar → "Close window", then reopen
- **Linux**: Select "Quit" from the menu, then reopen

### Using Salesforce with Claude

After setup, you can ask Claude things like:

- "How many accounts are in my Salesforce org?"
- "Show me all opportunities created this month"
- "Find contacts named John"
- "Create a new account for Acme Corp"
- "Update the status of case 00012345"

## Technical Details

### Requirements

- Node.js 18.0.0 or higher
- NPM (comes with Node.js)
- Claude Desktop
- Active Salesforce account with appropriate permissions

### How It Works

1. The MCP server checks if Salesforce CLI is installed
2. If not installed, it automatically installs via npm
3. Runs `sf org login web` which opens your browser for secure OAuth authentication
4. Verifies the connection by checking org status
5. Stores credentials securely via Salesforce CLI (not in plain text)

### Authentication Method

This tool uses **Salesforce CLI OAuth** (browser-based authentication):

- Opens your default browser to Salesforce login page
- Uses OAuth 2.0 authorization code flow
- Credentials are stored securely by Salesforce CLI
- Each user authenticates with their own account
- No passwords stored in config files

### Security

- ✅ Credentials never stored in plain text
- ✅ Authentication uses Salesforce's OAuth flow
- ✅ Credentials managed by Salesforce CLI's secure storage
- ✅ Each user authenticates with their own Salesforce account
- ✅ No shared service accounts

## Troubleshooting

### "Setup Failed" Message

If setup fails, try these steps:

1. Close Claude Desktop completely
2. Open your terminal/command prompt
3. Run: `npm install -g @salesforce/cli`
4. Run: `sf org login web --instance-url https://your-org.my.salesforce.com --alias mcp-server-connect`
5. Restart Claude Desktop

### Browser Doesn't Open

- Check your default browser settings
- Try running the manual command above in step 4
- Ensure pop-ups are not blocked
- Contact your IT administrator if issues persist

### Connection Not Working After Restart

- Make sure you completely quit Claude Desktop (not just closed the window)
- Verify the org alias by running: `sf org list`
- You should see `mcp-server-connect` in the list
- Check that the instance URL in your config matches your Salesforce org

### "Invalid JSON" Error

This usually means there's a version mismatch. Try:

1. Update Salesforce CLI: `npm install -g @salesforce/cli@latest`
2. Restart Claude Desktop
3. Run the setup again

### Permission Errors During Installation

On some systems, you may need administrator privileges:

- **Windows**: Run Command Prompt as Administrator
- **Mac/Linux**: Use `sudo npm install -g @salesforce/cli`

## Development

### Local Testing

```bash
# Clone the repository
git clone https://github.com/jake-hebert/connect-to-salesforce-mcp.git
cd connect-to-salesforce-mcp

# Install dependencies
npm install

# Test locally by adding to Claude Desktop config:
{
  "mcpServers": {
    "connect-to-salesforce-local": {
      "command": "node",
      "args": ["/absolute/path/to/index.js"],
      "env": {
        "SALESFORCE_INSTANCE_URL": "https://your-org.my.salesforce.com",
        "SALESFORCE_ORG_ALIAS": "mcp-server-connect"
      }
    }
  }
}
```

### Publishing Updates

```bash
# Update version in package.json
npm version patch  # or minor, major

# Publish to npm
npm publish --access public
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For technical support:

- Contact your IT administrator
- File an issue on the [GitHub repository](https://github.com/jake-hebert/connect-to-salesforce-mcp.git)
- Check the [Salesforce MCP documentation](https://github.com/tsmztech/mcp-server-salesforce)

## Related Projects

- [Salesforce MCP Server](https://github.com/tsmztech/mcp-server-salesforce) - The main MCP server for Salesforce operations
- [Model Context Protocol](https://github.com/anthropics/model-context-protocol) - Documentation for the MCP standard

## License

MIT

## Changelog

### v1.0.0

- Initial release
- Automatic Salesforce CLI installation
- Browser-based OAuth authentication
- Connection verification
- Cross-platform support (Windows, macOS, Linux)
