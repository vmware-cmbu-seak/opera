# -*- coding: utf-8 -*-
'''
   ____  _____  ______ _____             
  / __ \|  __ \|  ____|  __ \     /\     
 | |  | | |__) | |__  | |__) |   /  \    
 | |  | |  ___/|  __| |  _  /   / /\ \   
 | |__| | |    | |____| | \ \  / ____ \  
  \____/|_|    |______|_|  \_\/_/    \_\ 

@author: VMware Korea CMP TF
'''

import os
import sys
import argparse
from importlib.machinery import SourceFileLoader

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('-m', '--module', help='Module Name', required=True)
    args = parser.parse_args()
    module = args.module
    dir_path = os.path.dirname(os.path.realpath(__file__))
    if dir_path not in sys.path: sys.path.insert(0, dir_path)
    sys.path.insert(0, '{}/services/{}'.format(dir_path, module))
    SourceFileLoader('main', 'services/{}/main.py'.format(module)).load_module().handler(module)
