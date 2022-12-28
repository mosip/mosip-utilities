import sys
import os
import argparse
import requests
import json
from openpyxl.styles import Alignment
from openpyxl import load_workbook
from datetime import datetime
from threading import Thread

import config as conf
from utils.app_path import log_path, input_folder_path, output_folder_path
from utils.app_logger import init_logger, info, error, debug
from utils.app_file_helper import read_lines, writeFileFromList
from utils.app_session import MosipSession
from utils.app_helper import time_diff, get_time_in_sec

source_path1 = os.path.join(input_folder_path, '1.txt')
source_path2 = os.path.join(input_folder_path, '2.txt')

def args_parse():
    parser = argparse.ArgumentParser()
    # group = parser.add_mutually_exclusive_group(required=True)
    # group.add_argument('--print', action='store_true',  help='Create credential for print')
    # group.add_argument('--auth_vid', action='store_true',  help='Create credential for auth(VID)')
    # group.add_argument('--auth_uin', action='store_true',  help='Create credential for auth(UIN)')
    args = parser.parse_args()
    return args, parser

def main():
    start_time = get_time_in_sec()
    args, parser = args_parse()
    init_logger(log_file=log_path, level=conf.logger_level)
    try:
        if (source_path1 and source_path2):
            output_path = os.path.join(output_folder_path, "distinct_list.txt")
            final_list = []
            source_list1 = read_lines(source_path1)
            source_list2 = read_lines(source_path2)
            final_list = list(set(source_list1) - set(source_list2))
            # for source1 in source_list1:
            #     is_found = False
            #     for source2 in source_list2:
            #         if (source1 == source2):
            #             is_found = True
            #             break
            #     if (not is_found):
            #         final_list.append(source1)
            print(len(final_list))
            if(len(final_list) > 0):
                writeFileFromList(output_path, final_list)
        else:
            info(f"Source files are not present")
    except Exception as e:
        error(e)
    finally:
        prev_time, prstr = time_diff(start_time)
        info("Total time taken by the script: " + prstr)
        sys.exit(0)

if __name__ == "__main__":
    main()