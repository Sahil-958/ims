#!/bin/bash

ENDPOINT='http://localhost:5100/generate-caption'

# Maximum number of parallel processes
MAX_PARALLEL_JOBS=3

# Get terminal width
TERM_WIDTH=$(tput cols)

logs=$(mktemp -t logs_XXXXXX.txt)

rename_img() {
  local old="$1"
  local new="$2"
  if [ "${new#ERROR_}" != "$new" ]; then
    # String starts with "ERROR_"
    echo -e "Skipping image [$old]\nReason: ${new#ERROR_} " >>"$logs"
    return
  fi
  local old_name=$(basename "$old")
  local base_dir=$(dirname "$old")
  local ext=${old##*.}
  local new_name="$new.$ext"
  local counter=1
  if [ "$base_dir/$new_name" = "$old" ]; then
    echo -e "   Old name:[$old_name] == new name:[$new_name] Skipped" >>"$logs"
    return 1
  fi
  while [ -e "$base_dir/$new_name" ]; do
    if [ "$counter" -lt 10 ]; then
      padded_counter="0$counter" # Add padding for single-digit numbers
    else
      padded_counter="$counter"
    fi
    new_name="${new}_$padded_counter.$ext"
    counter=$((counter + 1))
  done
  if [ -f "$review_rename" ]; then
    echo "mv \"$old\" \"$base_dir/$new_name\" && echo \"Renaming [$old_name] to [$new_name]\" >> $logs" >>"$review_rename"
  else
    if [ "$dryRun" ]; then
      echo "Renaming [$old_name] to [$new_name]" >>"$logs"
    else
      mv "$old" "$base_dir/$new_name"
      echo "Renaming [$old_name] to [$new_name]" >>"$logs"
    fi
  fi
}

get_caption() {
  local image_file="$1"

  local filter='.[0].generated_text'

  local response=$(curl -s -X POST -F "file=@$image_file" "$ENDPOINT")
  local caption_text=$(echo "$response" | jq -er "$filter // (\"ERROR_\" + .error.message)")

  if [[ -n "$response_file" ]]; then
    echo "$response" >>"$response_file"
  fi

  if [ "$space_replacement" != "" ] && [ "${caption_text#ERROR_}" == "$caption_text" ]; then
    caption_text="${caption_text// /$space_replacement}"
  fi

  echo "$caption_text"
}

process_image() {
  if [ "$(stat -c %s "$1")" -le 20971520 ]; then
    local caption=$(get_caption "$1")
    rename_img "$1" "$caption"
  else
    echo "The specified file [$1] is not under 20,971,520 bytes (20.97MB) Please reduce the Size." >>"$logs"
  fi
}

init() {
  if [ "$single_file" != "" ]; then
    if [ -f "$single_file" ]; then
      # Get the file extension
      file_extension="${single_file##*.}"
      file_extension="${file_extension,,}" # Convert to lowercase for case-insensitive comparison
      # Check if the file extension indicates an image file
      if [[ "$file_extension" == "png" || "$file_extension" == "jpg" || "$file_extension" == "jpeg" ]]; then
        echo "Processing Single image file: $single_file"
        process_image "$single_file"
      else
        echo "Skipping non-image file: $single_file" >>"$logs"
      fi
    else
      echo "Error: File '$single_file' does not exist." >>"$logs"
    fi
  fi

  if [ "$dir" != "" ]; then
    if [ -d "$dir" ]; then
      echo "Max Parallel Jobs is: $MAX_PARALLEL_JOBS"
      IFS=$'\n'
      local images=()
      if [ "$depth" = "" ] || [ "$depth" -eq 0 ]; then
        readarray -t images < <(find "$dir" -type f -regex ".*\.\(jpg\|jpeg\|png\)")
      else
        readarray -t images < <(find "$dir" -maxdepth "$depth" -type f -regex ".*\.\(jpg\|jpeg\|png\)")
      fi
      if [ ${#images[@]} -eq 0 ]; then
        echo "No image files found in directory and it's sub directories: $dir" >>"$logs"
        return
      fi
      local count=0
      for image in "${images[@]}"; do
        if [ "$count" -lt "$MAX_PARALLEL_JOBS" ]; then
          ((count++))
          echo "Processing image - $image"
          process_image "$image" &
        else
          echo "Maximum parallel jobs reached. Waiting for a free slot to process image - $image"
          wait -n
          ((count--))
          echo "Processing image - $image"
          process_image "$image" &
          ((count++))
        fi
      done
      wait
    else
      echo "Error: Directory '$dir' does not exist." >>"$logs"
      return
    fi
  elif [ "$single_file" = "" ]; then
    echo "Error: No valid input provided." >>"$logs"
    usage
  fi
}

usage() {
  echo "Usage: $0 [options] <image1 dir>"
  echo "Options:"
  echo "  -h Prints this useage"
  echo "  -key API key for vision api ex: '22d12becea494ddb8e3a8544cb858b50'"
  echo "  -kf Same as the -key flag but uses file as input for api key (To hide the key in screen recording scenarios)"
  echo "  -endpoint Url of the vision api endpoint ex: 'https://basher.cognitiveservices.azure.com'"
  echo "  -p Set Concurrency Level How many image to process parallely (default: 3)"
  echo "  -r Accpets a file name to save the responses from api"
  echo "  -l Accpets a file name to save the logs"
  echo "  -sr By default names have spaces in them so use -sr flag to send a space replacement like _ or -"
  echo "  -sf Accept a single file instead of a dir"
  echo "  -d Accepts a depth level to search for images in sub directories. By default all sub directories are searched if depth is not provided or set to 0"
  echo "  -R Review the renaming commands before executing them by open them in $EDITOR"
  echo "Example:"
  echo "$0 -p 5 -sr _ -r responses.txt -kf api_key.txt -endpoint \"https://basher.cognitiveservices.azure.com\" ~/Pictures/"
  exit 1
}

while [[ $# -gt 0 ]]; do
  case $1 in
  -R)
    review_rename=$(mktemp -t review_rename_XXXXXX.sh)
    echo "#!/bin/bash
# You can review, edit, or remove the commands.
# This file gets executed when you exit your editor.
# If there are no renaming commands below then exit and check logs to see why.
                " >"$review_rename"
    ;;
  -dry)
    shift
    dryRun=true
    ;;

  -p)
    shift
    MAX_PARALLEL_JOBS=$1
    ;;
  -sf)
    shift
    single_file="$1"
    ;;
  -sr)
    shift
    space_replacement="$1"
    ;;
  -l)
    shift
    log_file=$1
    ;;
  -d)
    shift
    depth=$1
    ;;
  -r)
    shift
    response_file=$1
    ;;
  -endpoint)
    shift
    ENDPOINT="$1"
    ;;
  -h)
    usage
    ;;
  -*)
    echo "Unrecognized option: $1" >&2
    usage
    ;;
  *)
    dir="$1"
    ;;
  esac
  shift
done

init
if [ -f "$review_rename" ]; then
  "$EDITOR" "$review_rename"
  bash "$review_rename"
  rm "$review_rename"
fi
echo -e "\nLogs:"
# Print underscores equal to terminal width
printf "%-${TERM_WIDTH}s\n" "_" | tr ' ' '_'
cat "$logs"
# Print underscores equal to terminal width
printf "%-${TERM_WIDTH}s\n" "_" | tr ' ' '_'

if [[ -n "$log_file" ]]; then
  cat "$logs" >"$log_file"
fi
rm "$logs"
