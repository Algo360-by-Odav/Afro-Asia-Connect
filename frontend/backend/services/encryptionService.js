const crypto = require('crypto');
const bcrypt = require('bcrypt');

class EncryptionService {
  constructor() {
    // Use environment variable in production
    this.masterKey = process.env.ENCRYPTION_MASTER_KEY || 'your-256-bit-secret-key-here-change-in-production';
    this.algorithm = 'aes-256-gcm';
    this.keyLength = 32; // 256 bits
    this.ivLength = 16;  // 128 bits
    this.tagLength = 16; // 128 bits
  }

  // Generate a new encryption key for each conversation
  generateConversationKey() {
    return crypto.randomBytes(this.keyLength);
  }

  // Encrypt conversation key with master key
  encryptConversationKey(conversationKey) {
    const iv = crypto.randomBytes(this.ivLength);
    const cipher = crypto.createCipherGCM(this.algorithm, Buffer.from(this.masterKey), iv);
    cipher.setAAD(Buffer.from('conversation-key'));
    
    let encrypted = cipher.update(conversationKey);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    
    const tag = cipher.getAuthTag();
    
    return {
      encryptedKey: encrypted.toString('base64'),
      iv: iv.toString('base64'),
      tag: tag.toString('base64')
    };
  }

  // Decrypt conversation key
  decryptConversationKey(encryptedData) {
    try {
      const { encryptedKey, iv, tag } = encryptedData;
      
      const decipher = crypto.createDecipherGCM(this.algorithm, Buffer.from(this.masterKey), Buffer.from(iv, 'base64'));
      decipher.setAAD(Buffer.from('conversation-key'));
      decipher.setAuthTag(Buffer.from(tag, 'base64'));
      
      let decrypted = decipher.update(Buffer.from(encryptedKey, 'base64'));
      decrypted = Buffer.concat([decrypted, decipher.final()]);
      
      return decrypted;
    } catch (error) {
      throw new Error('Failed to decrypt conversation key');
    }
  }

  // Encrypt message content
  encryptMessage(message, conversationKey) {
    try {
      const iv = crypto.randomBytes(this.ivLength);
      const cipher = crypto.createCipherGCM(this.algorithm, conversationKey, iv);
      
      // Add additional authenticated data
      const aad = Buffer.from(JSON.stringify({
        timestamp: Date.now(),
        version: '1.0'
      }));
      cipher.setAAD(aad);
      
      let encrypted = cipher.update(message, 'utf8');
      encrypted = Buffer.concat([encrypted, cipher.final()]);
      
      const tag = cipher.getAuthTag();
      
      return {
        encryptedContent: encrypted.toString('base64'),
        iv: iv.toString('base64'),
        tag: tag.toString('base64'),
        aad: aad.toString('base64')
      };
    } catch (error) {
      throw new Error('Failed to encrypt message');
    }
  }

  // Decrypt message content
  decryptMessage(encryptedData, conversationKey) {
    try {
      const { encryptedContent, iv, tag, aad } = encryptedData;
      
      const decipher = crypto.createDecipherGCM(this.algorithm, conversationKey, Buffer.from(iv, 'base64'));
      decipher.setAAD(Buffer.from(aad, 'base64'));
      decipher.setAuthTag(Buffer.from(tag, 'base64'));
      
      let decrypted = decipher.update(Buffer.from(encryptedContent, 'base64'));
      decrypted = Buffer.concat([decrypted, decipher.final()]);
      
      return decrypted.toString('utf8');
    } catch (error) {
      throw new Error('Failed to decrypt message');
    }
  }

  // Hash sensitive data for storage
  async hashSensitiveData(data) {
    const saltRounds = 12;
    return await bcrypt.hash(data, saltRounds);
  }

  // Verify hashed data
  async verifySensitiveData(data, hash) {
    return await bcrypt.compare(data, hash);
  }

  // Generate secure tokens
  generateSecureToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  // Create message fingerprint for integrity checking
  createMessageFingerprint(messageData) {
    const hash = crypto.createHash('sha256');
    hash.update(JSON.stringify(messageData));
    return hash.digest('hex');
  }

  // Verify message integrity
  verifyMessageIntegrity(messageData, fingerprint) {
    const currentFingerprint = this.createMessageFingerprint(messageData);
    return currentFingerprint === fingerprint;
  }

  // Secure key derivation for user-specific encryption
  deriveUserKey(userId, masterKey = this.masterKey) {
    return crypto.pbkdf2Sync(userId.toString(), masterKey, 100000, 32, 'sha256');
  }

  // Encrypt file data
  encryptFile(fileBuffer, conversationKey) {
    try {
      const iv = crypto.randomBytes(this.ivLength);
      const cipher = crypto.createCipherGCM(this.algorithm, conversationKey, iv);
      
      let encrypted = cipher.update(fileBuffer);
      encrypted = Buffer.concat([encrypted, cipher.final()]);
      
      const tag = cipher.getAuthTag();
      
      return {
        encryptedFile: encrypted,
        iv: iv.toString('base64'),
        tag: tag.toString('base64')
      };
    } catch (error) {
      throw new Error('Failed to encrypt file');
    }
  }

  // Decrypt file data
  decryptFile(encryptedData, conversationKey) {
    try {
      const { encryptedFile, iv, tag } = encryptedData;
      
      const decipher = crypto.createDecipherGCM(this.algorithm, conversationKey, Buffer.from(iv, 'base64'));
      decipher.setAuthTag(Buffer.from(tag, 'base64'));
      
      let decrypted = decipher.update(encryptedFile);
      decrypted = Buffer.concat([decrypted, decipher.final()]);
      
      return decrypted;
    } catch (error) {
      throw new Error('Failed to decrypt file');
    }
  }

  // Database interaction methods
  async getConversationKey(conversationId) {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    try {
      const conversationKey = await prisma.conversationKey.findUnique({
        where: {
          conversationId: parseInt(conversationId)
        }
      });

      if (!conversationKey || !conversationKey.isActive) {
        return null;
      }

      // Decrypt the stored key
      const decryptedKey = this.decryptConversationKey({
        encryptedKey: conversationKey.encryptedKey,
        iv: conversationKey.iv,
        tag: conversationKey.tag
      });

      return {
        key: decryptedKey,
        version: conversationKey.keyVersion,
        id: conversationKey.id
      };
    } catch (error) {
      console.error('Failed to get conversation key:', error);
      return null;
    } finally {
      await prisma.$disconnect();
    }
  }

  async createConversationKey(conversationId) {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    try {
      // Generate new key
      const newKey = this.generateConversationKey();
      
      // Encrypt the key for storage
      const encryptedKeyData = this.encryptConversationKey(newKey);
      
      // Store in database
      const conversationKey = await prisma.conversationKey.create({
        data: {
          conversationId: parseInt(conversationId),
          encryptedKey: encryptedKeyData.encryptedKey,
          iv: encryptedKeyData.iv,
          tag: encryptedKeyData.tag,
          keyVersion: 1,
          isActive: true
        }
      });

      return {
        key: newKey,
        version: conversationKey.keyVersion,
        id: conversationKey.id
      };
    } catch (error) {
      console.error('Failed to generate conversation key:', error);
      throw error;
    } finally {
      await prisma.$disconnect();
    }
  }

  async rotateConversationKey(conversationId) {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    try {
      // Deactivate old key
      await prisma.conversationKey.updateMany({
        where: {
          conversationId: parseInt(conversationId),
          isActive: true
        },
        data: {
          isActive: false,
          rotatedAt: new Date()
        }
      });

      // Generate new key
      const newKey = this.generateConversationKey();
      const encryptedKeyData = this.encryptConversationKey(newKey);
      
      // Get current version and increment
      const lastKey = await prisma.conversationKey.findFirst({
        where: {
          conversationId: parseInt(conversationId)
        },
        orderBy: {
          keyVersion: 'desc'
        }
      });

      const newVersion = (lastKey?.keyVersion || 0) + 1;
      
      // Store new key
      const conversationKey = await prisma.conversationKey.create({
        data: {
          conversationId: parseInt(conversationId),
          encryptedKey: encryptedKeyData.encryptedKey,
          iv: encryptedKeyData.iv,
          tag: encryptedKeyData.tag,
          keyVersion: newVersion,
          isActive: true
        }
      });

      return {
        key: newKey,
        version: conversationKey.keyVersion,
        id: conversationKey.id
      };
    } catch (error) {
      console.error('Failed to rotate conversation key:', error);
      throw error;
    } finally {
      await prisma.$disconnect();
    }
  }
}

module.exports = new EncryptionService();
