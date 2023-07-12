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

import uvicorn
from common import getConfig


def handler(module):
    config = getConfig('opera.conf')
    uvicorn.run(
        'interfaces:app',
        host='0.0.0.0',
        port=int(config[module]['hostport']),
        reload=True if config['default']['stage'] == 'dev' else False,
        reload_dirs=['services/{}'.format(module)] if config['default']['stage'] == 'dev' else None
    )
