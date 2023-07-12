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
from pydantic import BaseModel
from typing import Optional


#===============================================================================
# Models
#===============================================================================
class EndpointStatus(BaseModel):
    endpoint: str
    check: bool
    detail: Optional[str] = ''

    
class Session(BaseModel):
    id: Optional[str] = ''
    userId: Optional[str] = ''
    accessToken: Optional[str] = ''
    aaEndpoints: Optional[list[EndpointStatus]] = []

    
class User(BaseModel):
    
    class EntryString(BaseModel):
        operation: Optional[str] = ''
        type: Optional[str] = ''
        primary: Optional[bool] = False
        value: Optional[str] = ''
        display: Optional[str] = ''
    
    class Name(BaseModel):
        honorificPrefix: Optional[str] = ''
        middleName: Optional[str] = ''
        familyName: Optional[str] = ''
        formatted: Optional[str] = ''
        givenName: Optional[str] = ''
        honorificSuffix: Optional[str] = ''
    
    class Address(BaseModel):
        locality: Optional[str] = ''
        country: Optional[str] = ''
        region: Optional[str] = ''
        primary: Optional[bool] = False
        formatted: Optional[str] = ''
        streetAddress: Optional[str] = ''
        postalCode: Optional[str] = ''
        type: Optional[str] = ''
    
    id: Optional[str] = ''
    externalId: Optional[str] = ''
    active: Optional[bool] = False
    userType: Optional[str] = ''
    name: Optional[Name] = {}
    userName: Optional[str] = ''
    displayName: Optional[str] = ''
    nickName: Optional[str] = ''
    title: Optional[str] = ''
    profileUrl: Optional[str] = ''
    entitlements: Optional[list[EntryString]] = []
    groups: Optional[list[EntryString]] = []
    roles: Optional[list[EntryString]] = []
    emails: Optional[list[EntryString]] = []
    phoneNumbers: Optional[list[EntryString]] = []
    addresses: Optional[list[Address]] = []
    photos: Optional[list[EntryString]] = []
    locale: Optional[str] = ''
    timeZone: Optional[str] = ''
    preferredLanguage: Optional[str] = ''
