# Define custom function directory
ARG FUNCTION_DIR="/function"

# Use a public ECR image for Node.js
FROM public.ecr.aws/docker/library/node:bookworm as build-image

# List files and system information for debugging
RUN ls -la
RUN cat /etc/os-release
RUN uname -a

# Set NPM cache directory
ENV NPM_CONFIG_CACHE=/tmp/.npm3

# Skip Chromium download for Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true

# Install system dependencies for Chrome, X server, and VNC server
RUN apt-get update && \
    apt-get install -yq \
    net-tools gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 \
    libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 \
    libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 \
    libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 \
    libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release \
    xdg-utils xvfb x11vnc x11-xkb-utils xfonts-100dpi xfonts-75dpi xfonts-scalable x11-apps wget \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install Google Chrome Stable and additional fonts
# Install Google Chrome Stable and fonts
# Note: this installs the necessary libs to make the browser work with Puppeteer.
RUN apt-get update && apt-get install curl gnupg -y \
  && curl --location --silent https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
  && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
  && apt-get update \
  && apt-get install google-chrome-stable -y --no-install-recommends \
  && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

# Install build dependencies
RUN apt-get update && \
    apt-get install -y \
    g++ \
    make \
    cmake \
    unzip \
    libcurl4-openssl-dev \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Use dumb-init to handle process signals
ADD https://github.com/Yelp/dumb-init/releases/download/v1.2.2/dumb-init_1.2.2_x86_64 /usr/local/bin/dumb-init
RUN chmod +x /usr/local/bin/dumb-init

# Set up the VNC server
RUN mkdir ~/.vnc && x11vnc -storepasswd 1234 ~/.vnc/passwd

# Expose default port for VNC server
EXPOSE 5900

ARG FUNCTION_DIR

# Create function directory and copy code
RUN mkdir -p ${FUNCTION_DIR}
COPY . ${FUNCTION_DIR}

# Set working directory
WORKDIR ${FUNCTION_DIR}

# Install npm dependencies including TypeScript
RUN npm install && \
    npm install -g typescript ts-node tsc

# List files in working directory
RUN pwd
RUN ls -la

# Set environment variables
ARG NODE_ENV
ENV NODE_ENV=$NODE_ENV

# Make container_start.sh executable
RUN chmod +x ./container_start.sh

# Expose application port
EXPOSE 8000

# Use dumb-init as the entrypoint
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["sh", "./container_start.sh"]
