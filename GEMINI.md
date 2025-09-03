## Directory Overview

This directory, `/Users/office`, is the user's home directory. It serves as a central hub for development activities, containing shell configurations, settings for various development tools, project folders, and miscellaneous scripts. The environment is set up for a range of development tasks, with a focus on JavaScript/TypeScript (Node.js), Rust, Solana, and containerization with Docker.

## Key Files & Directories

*   **Shell Configuration (`.zshrc`, `.zprofile`):** The user's shell is Zsh. The configuration (`.zshrc`) sets up the environment, including:
    *   **Solana:** The path for the Solana CLI tools is configured.
    *   **NVM (Node Version Manager):** NVM is loaded to manage Node.js versions. The PATH is explicitly set to use Node.js v24.3.0.
    *   **Docker:** Docker Desktop has added shell completions.

*   **Git Configuration (`.gitconfig`):** Contains the user's Git identity:
    *   **Name:** muntianus
    *   **Email:** rusdevs@proton.me

*   **Development Tooling Configs:** Several hidden directories store settings for a wide array of development tools:
    *   `.nvm`, `.npm`: Node.js version and package management.
    *   `.cargo`, `.rustup`: Rust toolchain and package management.
    *   `.docker`, `.minikube`, `.kube`: Containerization and Kubernetes configuration.
    *   `.config/gh`: GitHub CLI configuration.

*   **Project Directories:** Several subdirectories appear to be distinct software projects, including `projects/`, `globex/`, `order-lab/`, `hello_world/`, and others.

*   **Load Testing Scripts (`test.js`, `kravemart_test.js`):** Recent k6 scripts for performance testing websites like `alphwu.cfd` and `grocery.kravemart.com` are present.

*   **Root `package.json`:** A `package.json` file exists at the root, indicating a dependency on `har-to-k6`, a tool for converting HAR files to k6 scripts.

## Usage & Conventions

Based on this context, I will:

*   Assume a development environment centered around Zsh, Node.js, Rust, Solana, and Docker.
*   Recognize that this is a multi-project workspace, and will ask for clarification when working on a specific sub-project.
*   Use the established Git identity for any version control operations.
*   Leverage the installed tools like `k6`, `npm`, and the `jmeter-to-k6` converter when appropriate for performance testing tasks.
