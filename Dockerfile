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

# We don't need the standalone Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true

# Install Google Chrome Stable and fonts
# Note: this installs the necessary libs to make the browser work with Puppeteer.
RUN apt-get update && apt-get install curl gnupg -y \
  && curl --location --silent https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
  && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
  && apt-get update \
  && apt-get install google-chrome-stable -y --no-install-recommends \
  && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

# Include global arg in this stage of the build
ARG FUNCTION_DIR

# Install build dependencies
RUN apt-get update && \
    apt-get install -y \
    g++ \
    make \
    cmake \
    unzip \
    libcurl4-openssl-dev

# Create function directory and copy code
RUN mkdir -p ${FUNCTION_DIR}
COPY . ${FUNCTION_DIR}

# Set working directory
WORKDIR ${FUNCTION_DIR}

# List files in working directory
RUN pwd
RUN ls -la

# Install npm dependencies including TypeScript
RUN npm install

# Install additional system dependencies including dbus and X11 libraries
RUN apt-get install -y \
    libnss3 libnss3-dev \
    libnspr4 libnspr4-dev \
    libdbus-1-3 dbus-x11 \
    libatk1.0-0 libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libxkbcommon0 \
    libatspi2.0-0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    ca-certificates \
    fonts-liberation \
    libappindicator3-1 \
    libc6 \
    libcairo2 \
    libexpat1 \
    libfontconfig1 \
    libgcc1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libpango-1.0-0 libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 libx11-xcb1 libxcb1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    lsb-release \
    wget \
    xdg-utils \
    xvfb

# Install TypeScript, ts-node, tsc globally
RUN npm install -g typescript ts-node tsc

# List files in working directory again
RUN pwd
RUN ls -la

# Set the entrypoint to run your TypeScript file using xvfb-run to handle the X server
ENTRYPOINT ["xvfb-run", "--auto-servernum", "--server-args='-screen 0 1024x768x24'", "ts-node", "index.ts"]
