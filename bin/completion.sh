###-begin-ak-completion-###
#
# ak command completion script
#
# Installation: ak completion >> ~/.bashrc  (or ~/.zshrc)
# Or, maybe: ak completion > /usr/local/etc/bash_completion.d/ak
#

COMP_WORDBREAKS=${COMP_WORDBREAKS/=/}
COMP_WORDBREAKS=${COMP_WORDBREAKS/@/}
export COMP_WORDBREAKS

if type complete &>/dev/null; then
  _ak_completion () {
    local si="$IFS"
    IFS=$'\n' COMPREPLY=($(ak completion -- "${COMP_WORDS[@]}" 2>/dev/null)) || return $?
    IFS="$si"
  }
  complete -o default -F _ak_completion ak
elif type compdef &>/dev/null; then
  _ak_completion() {
    local si=$IFS
    compadd -- $(ak completion -- "${words[@]}" 2>/dev/null)
    IFS=$si
  }
  compdef _ak_completion ak
elif type compctl &>/dev/null; then
  _ak_completion () {
    local cword line point words si
    read -Ac words
    read -cn cword
    let cword-=1
    read -l line
    read -ln point
    si="$IFS"
    IFS=$'\n' reply=($(ak completion -- "${words[@]}" 2>/dev/null)) || return $?
    IFS="$si"
  }
  compctl -K _ak_completion ak
fi
###-end-ak-completion-###
