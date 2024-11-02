{
  description = "control-center development workspace";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs { inherit system; };
        # systemArch = builtins.elemAt (builtins.split "-" system) 0;
        # arch = if systemArch == "x86_64" then "amd64" else systemArch;
        os = builtins.elemAt (builtins.split "-" system) 2;
        # arch = builtins.elemAt (builtins.split "-" system) 0;
        arch = "amd64";
        # os = "linux";
      in
      {
        devShells.default = pkgs.mkShell {
          # hardeningDisable = [ "all" ];

          buildInputs = with pkgs; [
            # cli tools
            go-task
            zip
            jq

            # source version control
            git
            pre-commit

            # programming tools
            # nodejs-slim_21
            nodejs_20
            nodePackages.pnpm
            nodePackages.npm

            # build tools
            # (writeShellScriptBin "run" ''
            #   #! /usr/bin/env bash
            #   echo out is $out
            #   dest=$HOME/.local/bin/run-flake
            #   mkdir -p $(dirname $dest)
            #   echo "system=${system} os=${os} arch=${arch}"
            #   if ! command -v $dest &> /dev/null; then
            #     echo "Downloading runfile runner"
            #     echo 'curl -L0 https://github.com/nxtcoder17/Runfile/releases/download/nightly/run-${os}-${arch} > $dest'
            #     curl -L0 https://github.com/nxtcoder17/Runfile/releases/download/nightly/run-${os}-${arch} > $dest
            #     chmod +x $dest
            #   fi
            #   $dest "$@"
            # '')

            (pkgs.stdenv.mkDerivation rec {
              name = "run-flake";
              src = fetchurl {
                url = "https://github.com/nxtcoder17/Runfile/releases/download/nightly/run-${os}-${arch}";
                hash = "sha256-ml/jI0yVEzM1IWBQKfm+PZeTUc7QCiskDSc1dQoU8ck=";
              };
              dontUnpack = true;
              installPhase = ''
                echo "hello" >> ./sample.txt
                  mkdir -p $out
                  echo "$src"
                  ls -al $src
                  cp $src $out
              '';
            })
          ];

          shellHook = ''
          '';
        };
      }
    );
}


