{
  description = "React development environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
      in
      {
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            pnpm
            nodejs
            just
            typescript-language-server
          ];

          shellHook = ''
            if [ -z "$TMUX" ]; then
              SESSION_NAME="nix-$(basename "$PWD")"
              if tmux has-session -t $SESSION_NAME 2>/dev/null; then
                exec tmux attach-session -t $SESSION_NAME
              else
                exec tmux new-session -s $SESSION_NAME
              fi
            fi
          '';
        };
      });
}

