{
  description = "development workspace";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
  };

  outputs = {
    self,
    nixpkgs,
    flake-utils,
  }:
    flake-utils.lib.eachDefaultSystem (
      system: let
        pkgs = import nixpkgs {
          inherit system;
          # config.allowUnfree = true;
        };

        archMap = {
          "x86_64" = "amd64";
          "aarch64" = "arm64";
        };

        arch = builtins.getAttr (builtins.elemAt (builtins.split "-" system) 0) archMap;
        os = builtins.elemAt (builtins.split "-" system) 2;
      in {
        devShells.default = pkgs.mkShell {
          # hardeningDisable = [ "all" ];

          buildInputs = with pkgs; [
            (stdenv.mkDerivation rec {
              name = "run";
              pname = "run";
              src = fetchurl {
                url = "https://github.com/nxtcoder17/Runfile/releases/download/v1.5.3/run-${os}-${arch}";
                sha256 = builtins.getAttr "${os}/${arch}" {
                  "linux/amd64" = "BRTgIIg1D+Q4nYN4Z5LoHv+NKamT34qOZZDUxpZkBa0=";
                  "linux/arm64" = "wz0ReA/yvZ1ktMGkLc/vMe/gTDpeI6clL+IBYCUo+Yo=";
                  "darwin/amd64" = "it/EhW10tZlyEL5reH9FhSFfPSslQr0AgzDcgeqngcI=";
                  "darwin/arm64" = "aS+b1GoivZmqINb/wBmjXMK4pUWLs17lc2z/FRw/Dx0=";
                };
              };
              unpackPhase = ":";
              installPhase = ''
                mkdir -p $out/bin
                cp $src $out/bin/$name
                chmod +x $out/bin/$name
              '';
            })

            # your packages here
            # go-task
            zip
            jq

            # source version control
            git
            # pre-commit

            nodejs-slim
            nodePackages.pnpm
          ];

          shellHook = ''
          '';
        };
      }
    );
}
