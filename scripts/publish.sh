echo "---------------------------"
echo "Publish Version"
echo "---------------------------"

while true
do
    echo "please select tag: (A-alpha, S-stable, L-latest)"
    read selection
    if [[ "$selection" == "A" || "$selection" == "a" ]]; then
        tag="alpha"
        break

    elif [[ "$selection" == "S" || "$selection" == "s"  ]]; then
        tag="stable"
        break

    elif [[ "$selection" == "L" || "$selection" == "l"  ]]; then
        tag="latest"
        break
    fi
done

echo "set tag = $tag"

yarn config set version-tag-prefix "" && yarn config set version-git-message "publish package version %s" && yarn version && git log -1

if [[ $? != 0 ]]; then
    exit $?
fi

read -p "publish package now ? (y/N): " answer;

if [[ "$answer" == "Y" || "$answer" == "y" ]]; then
    npm publish --tag $tag
else
    echo 'finished'
fi

