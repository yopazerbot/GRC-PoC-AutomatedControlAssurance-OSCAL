# Wrapper around the upstream immudb image so it can write to a
# Railway-mounted volume. Railway mounts volumes as root:root, but the
# upstream codenotary/immudb image runs as the non-root `immudb` user
# and fails with "permission denied" on /var/lib/immudb/immudb.identifier.
# Forcing USER root here is fine for this PoC: immudb is reachable only
# on the project's private network, never on a public domain.
FROM codenotary/immudb:1.9.5
USER root
