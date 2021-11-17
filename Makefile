dev_container_build:
	docker build \
	-t local-dev/node:latest \
	--network host \
	--build-arg BUILD_DATE=$(shell date -u +'%Y-%m-%dT%H:%M:%SZ') \
	--build-arg VCS_REF=master \
	--build-arg VERSION=latest \
	.
run:
	docker run --network host --rm -v $(PWD):/workspace -w /workspace -it local-dev/node:latest /bin/bash
