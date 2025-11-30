# Copyright (C) 2016-2018  Jones Magloire @Joxit
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU Affero General Public License for more details.
#
# You should have received a copy of the GNU Affero General Public License
# along with this program.  If not, see <http://www.gnu.org/licenses/>.
FROM node:20-alpine

LABEL maintainer="Jones MAGLOIRE @Joxit"

WORKDIR /app

# Environment variables
ENV PORT=80
ENV REGISTRY_URL=''
ENV NGINX_PROXY_PASS_URL=''
ENV REGISTRY_DATA_PATH='/var/lib/registry'
ENV REGISTRY_READMES_PATH='docker/registry/v2/repositories'
ENV STATIC_DIR='/app/dist'

# Copy server and static files
COPY server/ /app/server/
COPY dist/ /app/dist/
COPY favicon.ico /app/dist/

# Create directory for registry data
RUN mkdir -p /var/lib/registry

EXPOSE 80

CMD ["node", "/app/server/index.cjs"]