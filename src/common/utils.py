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
import urllib3
import asyncio
import logging
import datetime
import configparser


#===============================================================================
# Setting
#===============================================================================
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)


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
    def register(cls, config): setEnvironment('LOG', Logger(config['default']['stage']))
    
    def __init__(self, stage):
        self._logger = logging.getLogger(name='uvicorn.default')
        if stage == 'dev': self._logger.setLevel(logging.DEBUG)
        elif stage == 'prod': self._logger.setLevel(logging.INFO)

    def _formatter_(self, message): return f'[{datetime.datetime.now()}] {message}'
    
    def DEBUG(self, message): self._logger.debug(self._formatter_(message))

    def INFO(self, message): self._logger.info(self._formatter_(message))

    def WARN(self, message): self._logger.warning(self._formatter_(message))

    def ERROR(self, message): self._logger.error(self._formatter_(message))

    def CRITICAL(self, message): self._logger.critical(self._formatter_(message))


class TaskOperator:
    
    def __init__(self): self._task_operator_tasks = []

    def __enter__(self): return self

    def __exit__(self, exc_type, exc_val, exc_tb): pass
    
    def do(self, ref):
        self._task_operator_tasks.append(ref)
        return self
    
    async def wait(self):
        return await asyncio.gather(*(self._task_operator_tasks))
