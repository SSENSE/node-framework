# SSENSE Node.js Framework

Base framework grouping all SSENSE's utilities for Node.js developers

[![Build Status](https://travis-ci.org/SSENSE/node-framework.svg?branch=master)](https://travis-ci.org/SSENSE/node-framework)
[![Coverage Status](https://coveralls.io/repos/github/SSENSE/node-framework/badge.svg?branch=master)](https://coveralls.io/github/SSENSE/node-framework?branch=master)
[![Latest Stable Version](https://img.shields.io/npm/v/@ssense/framework.svg)](https://www.npmjs.com/package/@ssense/framework)
[![npm Downloads](https://img.shields.io/npm/dm/@ssense/framework.svg)](https://www.npmjs.com/package/@ssense/framework)

## Installation

Download as a dependency using [npm](https://www.npmjs.com/).

```node
npm install --save @sssense/framework
```

## Usage

@ssense/framework contains a number of utilities that are used in many of the microservices that exist in the SSENSE technology stack. Therefore before implementing a common utility you should check that the functionality doesn't already exist here.

Currently the following is bundled into @ssense/framework:

- Redis Cache
- List of Common Exceptions
- Request Validation
- Safe Shutdown Server
- Slack Notifier
- Logger
- Mongo Connection
- Promise Pool
- PubSub Emitter and Parser

## Redis Cache

This utility handles setting up a redis connection within your microservice. To intialize you must provide a connection object, for example:

```typescript
import { RedisConnection } from '@ssense/framework';

const redisConfig = {
    host: config.get<string>('cache.host'),
    port: config.get<number>('cache.port'),
    db: config.get<number>('cache.database'),
    password: config.get<string>('cache.password'),
    separator: config.get<string>('cache.separator')
};

const cache = new RedisConnection(redisConfig);
```

All variables in the config object are optional.

The following commands will be available to you when using this utility:

```typescript
onError(callback: (err: Error) => any): void;
getSeparator(): string;
setSeparator(separator: string): void;
get<T>(key: string|string[]): Promise<T>;
getTtl(key: string|string[]): Promise<number>;
getBuffer(key: string|string[]): Promise<Buffer>;
set<T>(key: string|string[], value: T, ttl?: number): Promise<void>;
setBuffer(key: string|string[], value: Buffer, ttl?: number): Promise<void>;
del(key: string|string[]): Promise<void>;
flush(): Promise<void>;
keys(match: string): Promise<string[]>;
```

Refer to [ioredis](https://github.com/luin/ioredis) for more information on the functions get, getTtl, getBuffer, set, setBuffer, del, flush and keys. For getSeparator and setSeparator you simply have the ability to get and set the seperator between key parts (by default the seperator is ':'), therefore you can supply an array of key parts to all functions instead of creating the key yourself. onError is a way to set the callback when errors occurs on the redis side.

## List of Common Exceptions

A simple utility for abstracting exceptions.

The following are included:

- BadRequestException: 400
- UnauthorizedException: 401
- ForbiddenException: 403
- NotFoundException: 404
- MethodNotAllowedException: 405
- ConflictException: 409
- TooManyRequestsException: 429

All the listed exceptions are extended from the Exception class which has the following functions and public variables available to it:

```typescript
statusCode: number;
code: string;
details?: any;
body: {code: string, message: string, details?: any};

static fromHttpCode(httpCode: number, message: string, code?: string, details?: any): Exception;
toJSON(): {code: string, message: string, details?: any};
```

## Request Validation

Used to validate requests. Simply provide a validation object to the validate function as follows:

```typescript
import { RequestValidator, RequestValidation } from '@ssense/framework';

const validation: RequestValidation = {
    query: {
        language: {
            type: 'string',
            required: true,
            values: ['en', 'fr', 'ja']
        },
        country: {
            type: 'string',
            required: true
        },
        a: {
            type: 'string',
        },
        b: {
            type: 'number',
            requires: ['a'],
            mutuallyExcludes: ['c']
        },
        c: {
            type: 'string',
            requires: ['a']
        }
    }
};

const validate = RequestValidator.validate(validation);
```

The function returned from RequestValidator.validate() will be another function that can be used to validate an http request. Pass in the request, response and error callback as follows:

```typescript
validate(req, res, (err?: Error) => {
    next(err);
});
```

For more information please check the [typescript definition file](https://github.com/SSENSE/node-framework/blob/master/index.d.ts).

## Safe Shutdown Server

Use this utility to wrap a standard Express or Restify Server when creating servers in your application. It simply provides extra functionality to allow for safe shutdowns of the server. This can be useful when kubernetes makes requests to an application for graceful shutdown during autoscaling.

Example usage:

```typescript
import { SafeShutdownServer } from '@ssense/framework';

const server = SafeShutdownServer.create(someOtherServer);

// use the server as usual
server.listen(3000, () => {});

// ...
// ...

// within some function execute the safeShutdown method
await server.safeShutdown();
```

## Slack Notifier

Adding a slack notifier to each microservice can be cumbersome, use this utility in your index file to quickly implement a slack integration within your microservice.

```typescript
import { SlackNotifier } from '@ssense/framework';

const slackBot = ((): SlackNotifier => {
    try {
        return new SlackNotifier(
                <string> config.get('slack.webHookUrl'),
                <string> config.get('slack.defaultChannel'),
                <string> config.get('slack.username'),
                ':troll:'
            );
    } catch (err) {
        // some error with slack notifier creation
    }
});

// ...
// ...

await slackBot.send('error message', 'error stack');
```

## Logger

Use the standardized loggers in your microservice as follows:

```typescript
import {
    Logger,
    AppLogger,
    LogLevel,
    AccessLogger,
    RequestLogger
} from '@ssense/framework';

const logger: Logger = new AppLogger(
    'microservice name',
    <LogLevel> config.get('logger.level'),
    optionalStreamObject
);

// optionalStreamObject: { write: Function }

try {
    // some code that throws an error
} catch (error) {
    logger.error(`Some error message`, someRequestId, anArrayOfTags, error.stack);
}

const requestLogger: RequestLogger = logger.getRequestLogger(requestId);

request.logger(message, tags, details);

// ...
// ...

const accessLogger = new AccessLogger('some app id');

// log http requests when set in your middleware
accessLogger.logRequest(req, res, next);
```

In the AppLogger you have access to basic log methods: log, silly, verbose, info, warn, and error. You can also manipulate the logger configuration with the following functions:

```typescript
enable(enabled: boolean);
setAppId(appId: string);
getAppId();
generateRequestId();
setLevel(level: LogLevel);
getLevel();
setPretty(pretty: boolean);
setStream(stream: {write: Function});

// Returns a RequestLogger with basic log functions sily, verbose, warn, info and error
getRequestLogger(requestId: string)
```

AccessLogger is simply used in your middlewares to record http requests. It is similar to AppLogger but only has the following configuration functions available to it:

```typescript
enable(enabled: boolean);
setPretty(pretty: boolean);
setStream(stream: {write: Function});
setAppId(appId: string);
setUserIdCallback(callback: UserIdCallback);
```

## Mongo Connection

The mongo connection utility allows you to setup a connection with mongo in the following way:

```typescript
import { MongoConnection } from '@ssense/framework';

new MongoConnection({
    database: config.get<string>('database.mongodb.database'),
    connectionString: config.get<string>('database.mongodb.connectionString'),
    shardedCluster: config.get<boolean>('database.mongodb.shardedCluster'),
    readPreference: config.get<any>('database.mongodb.readPreference'),
    replicaSetName: config.get<string>('database.mongodb.replicaSetName'),
    username: config.get<string>('database.mongodb.username'),
    password: config.get<string>('database.mongodb.password'),
    debug: mongoDebug
});
```

With this you have access to functions connect, disconnect and getModel.

For more information please check the code for specific implementation details.

## Promise Pool

The idea behind a promise pool is that you want to handle a large volume of promises but you do not want to use Promise.all because it is an all or nothing approach. The promise pool allows you to execute a large number of promises concurrently and if any promise is to fail it will continue the execution of the promises uninterupted. Also you can specify the number of promises that should be run in parallel to prevent overwhelming the function that is servicing your asynchronous requests.

Example usage:

```typescript
import { PromisePool } from '@ssense/framework';

const pool = new PromisePool(promiseGeneratorFunction, numberOfParallelRequests);

// Add pool event handlers
pool.onResolved(resolvingFunction);
pool.onRejected(rejectingFunction);
```

An example of a promiseGeneratorFunction would be a function that processes a list of product keys by making a request to a remote server for information on said product key (returning the request promise). The generator would simply pop keys from the list and make the request if the list still had keys to pop, otherwise it would return null.

## PubSub Emitter and Parser

To make sending and handling pubsub requests easy, the following utilities have been added to the framework.

Emitter example usage:

```typescript
import { PubsubEmitter } from '@ssense/framework';

const pubsub = new PubsubEmitter({
    host: host,
    accessToken: accessToken,
    userAgent: userAgent,
    port: port,
    timeout: timeout,
    async: async
});

await pubsub.emit(message, payload)
    .catch((error: Error) => {
        // handle error
    });
```

Parser example usage:

```typescript
import { PubsubParser } from '@ssense/framework';

// takes optional boolean parameter isDevMode to prevent validating message in development
// isDevMode is false by default, set to true to prevent validation
const pubsub = new PubsubParser();

const parsedPubsubMessage = pubsub.parse(pubSubEmitPayload);

// Example properties:

// provider: string
// id: string
// topic: string
// date: Date
// data: any
// isSubscription: boolean
// isUnsubscription: boolean
```

## Contributing

Please reach out to us if you think extra logic should be added to this repo. The hope is that all common logic between microservices be located here so if you find yourself implementing the same logic over and over again, consider adding it to this repo.