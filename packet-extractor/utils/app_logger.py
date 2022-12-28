import logging
import pprint

class Colors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'

def is_str(s):
    return isinstance(s, str)

def init_logger1(log_file):
    logging.basicConfig(filename=log_file, filemode='w', level=logging.INFO)
    root_logger = logging.getLogger()
    console_handler = logging.StreamHandler()
    root_logger.addHandler(console_handler)

def init_logger(logger_name, log_file, level=logging.INFO, mode='a', stdout=True):
    logger = logging.getLogger(logger_name)
    formatter = logging.Formatter('%(asctime)s %(levelname)s %(name)s - %(message)s')
    fileHandler = logging.FileHandler(log_file, mode=mode, encoding='utf-8')
    fileHandler.setFormatter(formatter)
    streamHandler = logging.StreamHandler()
    streamHandler.setFormatter(formatter)
   
    logger.setLevel(level)
    logger.addHandler(fileHandler)
    if stdout:
        logger.addHandler(streamHandler) 

def debug(logger_name, msg):
    logger = logging.getLogger(logger_name)
    logger.debug(pprint.pformat(msg, width=120))

def info(logger_name, msg):
    logger = logging.getLogger(logger_name)
    logger.info(pprint.pformat(msg, width=120))

def warning(logger_name, msg):
    logger = logging.getLogger(logger_name)
    logger.warn(pprint.pformat(msg, width=120))

def error(logger_name, msg):
    logger = logging.getLogger(logger_name)
    logger.error(pprint.pformat(msg, width=120))

def critical(logger_name, msg):
    logger = logging.getLogger(logger_name)
    logger.critical(pprint.pformat(msg, width=120))

def myprint(msg, head=None):
    if msg is None:
        return
    if head == 1:
        logging.info('\n\n=================================================================== ')
        logging.info(Colors.HEADER + Colors.BOLD + (pprint.pformat(msg) if not is_str(msg) else msg) + Colors.ENDC)
    elif head == 2:
        logging.info('\n')
        logging.info(Colors.OKBLUE + ((pprint.pformat(msg) if not is_str(msg) else msg) + Colors.ENDC))
    elif head == 3:
        logging.info(Colors.OKBLUE + "- " + ((pprint.pformat(msg) if not is_str(msg) else msg) + Colors.ENDC))
    elif head == 4:
        logging.info("- " + (pprint.pformat(msg) if not is_str(msg) else msg))
    elif head == 11:
        logging.info(Colors.WARNING + "- " + (pprint.pformat(msg) if not is_str(msg) else msg) + Colors.ENDC)
    elif head == 12:
        logging.info(Colors.OKGREEN + "- " + (pprint.pformat(msg) if not is_str(msg) else msg) + Colors.ENDC)
    elif head == 13:
        logging.info(Colors.FAIL + (pprint.pformat(msg) if not is_str(msg) else msg) + Colors.ENDC)
    else:
        logging.info("- " + (pprint.pformat(msg) if not is_str(msg) else msg))