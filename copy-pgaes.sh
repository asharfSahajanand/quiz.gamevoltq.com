#!/bin/bash

SOURCE_DIR="/var/www/html/quiz.nextlevelplay.in"

for dir in /var/www/html/quiz.*; do
    [ ! -d "$dir" ] && continue

    # source directory skip
    [ "$dir" = "$SOURCE_DIR" ] && continue

    cp "$SOURCE_DIR/about-us.html" "$dir/"
    cp "$SOURCE_DIR/privacy-policy.html" "$dir/"
    cp "$SOURCE_DIR/terms-conditions.html" "$dir/"

    echo "Copied to $(basename "$dir")"
done

echo "Done!"
