# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This directory contains multiple projects and testing scenarios:

1. **telegram-reminder-1/** - Go Telegram bot for scheduled messages with OpenAI integration
2. **globex/** - Full-stack web application (React frontend + FastAPI backend)
3. **projects/** - Various testing scenarios including k6 performance tests
4. **JavaScript files** - k6 load testing scripts for web applications

## Build and Development Commands

### Telegram Bot (telegram-reminder-1/)
```bash
# Build the bot
go build -o bot

# Run tests
go test ./...

# Run with coverage
go test -cover ./...

# Format code (required before PR)
gofmt -w -s

# Lint (install first: go install github.com/golangci/golangci-lint/cmd/golangci-lint@v1.63.0)
go vet ./...
golangci-lint run

# Run locally
go run main.go

# Docker build
docker build -t telegram-bot .
```

### Globex Frontend (globex/frontend/)
```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test

# TypeScript check (inferred from setup)
npm run build  # Will fail on TypeScript errors
```

### Globex Backend (globex/backend/)
```bash
# Install Python dependencies (inferred)
pip install fastapi uvicorn passlib[bcrypt] python-jose

# Run development server (typical FastAPI)
uvicorn main:app --reload
```

### Load Testing
```bash
# Run k6 tests
k6 run script.js
k6 run kravemart_test.js
k6 run kravemart_parameterized.js
```

## Architecture

### Telegram Bot Structure
- **main.go**: Application entry point with configuration loading
- **internal/bot/**: Core bot functionality, handlers, OpenAI integration
- **internal/config/**: Environment configuration management
- **internal/logger/**: Logging setup
- Root level test files test various bot components
- Uses scheduled tasks with cron-like timing (lunch at 13:00, brief at 20:00)
- OpenAI integration for message generation
- Whitelist management for authorized chats

### Globex Application
- **Frontend**: React 19 + TypeScript + Bootstrap 5
- **Backend**: FastAPI with JWT authentication, bcrypt password hashing
- Component-based architecture with separation of concerns
- Mock data currently used in frontend

### Key Environment Variables (Telegram Bot)
- `TELEGRAM_TOKEN`: Required
- `OPENAI_API_KEY`: Required  
- `CHAT_ID`: Optional initial chat ID
- `OPENAI_MODEL`: Optional (default: gpt-4o)
- `LUNCH_TIME`: Optional (default: 13:00)
- `BRIEF_TIME`: Optional (default: 20:00)
- `TASKS_FILE`: Optional path to YAML tasks file
- `WHITELIST_FILE`: Optional (default: whitelist.json)
- `LOG_LEVEL`: Optional (debug, info, warn, error)

## Testing Standards

### Go Testing
- All test files follow `*_test.go` naming convention
- Tests include unit tests, integration tests, and edge case testing
- Coverage reports generated with `go test -cover`
- Test files are located both at package root and within internal packages

### Frontend Testing  
- Uses React Testing Library + Jest
- Test files follow `*.test.tsx` convention (inferred from dependencies)

### Load Testing
- k6 scripts test web application performance
- Parameterized tests available for different scenarios
- Scripts include realistic user workflows and load patterns

## Development Workflow
1. Always run `gofmt -w -s` before commits (Go projects)
2. Run `go vet ./...` for Go code analysis
3. Use `golangci-lint run` for comprehensive Go linting
4. Ensure tests pass before creating pull requests
5. For Docker deployments, test locally before pushing

## Key Dependencies
- **Go**: telegram bot (gopkg.in/telebot.v3, go-openai, gocron)  
- **Node.js**: React frontend with TypeScript
- **Python**: FastAPI backend with JWT authentication
- **k6**: Performance testing tool