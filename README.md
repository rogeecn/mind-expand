# Mind Extend

## Docker

### Build locally

```bash
npm run docker:build
```

### Run locally

```bash
npm run docker:run
```

Open http://localhost:3000

### Publish (GitHub Actions)

Push a git tag to publish to GHCR:

```bash
git tag v0.1.0
git push origin v0.1.0
```

Images published:

- ghcr.io/rogeecn/mind-extend:v0.1.0
- ghcr.io/rogeecn/mind-extend:latest
