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

#===============================================================================
# Import
#===============================================================================
import sys
import logging
import datetime
import configparser


#===============================================================================
# Helper
#===============================================================================
def setEnvironment(key, value):
    __builtins__[key] = value


def getConfig(path):
    config = configparser.ConfigParser()
    config.read(path, encoding='utf-8')
    return config


class Logger:
    
    @classmethod
    def register(cls, config, name='uvicorn.default'): setEnvironment('LOG', Logger(config['default']['stage'], name))
    
    def __init__(self, stage, name):
        if name: self._logger = logging.getLogger(name=name)
        else:
            self._logger = logging.getLogger()
            self._logger.addHandler(logging.StreamHandler(sys.stdout))
        if stage == 'dev': self._logger.setLevel(logging.DEBUG)
        elif stage == 'prod': self._logger.setLevel(logging.INFO)

    def _formatter_(self, message): return f'[{datetime.datetime.now()}] {message}'
    
    def KEYVAL(self, key, val): return f' - {key:<24} : {val}'
    
    def DEBUG(self, message): self._logger.debug(self._formatter_(message))

    def INFO(self, message): self._logger.info(self._formatter_(message))

    def WARN(self, message): self._logger.warning(self._formatter_(message))

    def ERROR(self, message): self._logger.error(self._formatter_(message))

    def CRITICAL(self, message): self._logger.critical(self._formatter_(message))
