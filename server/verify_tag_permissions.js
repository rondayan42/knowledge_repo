
const { pool } = require('./database');
const { Tags, Categories, Departments, Priorities } = require('./models');

async function verify() {
    try {
        console.log('Verifying Metadata Permissions...');

        const testUser = 'user-' + Date.now();

        // Test Tags
        console.log('\n--- Testing Tags ---');
        const tag = await Tags.create('test-tag-' + Date.now(), testUser);
        console.log('Tag created. Creator:', tag.created_by);
        if (tag.created_by !== testUser) console.error('FAIL: Tag creator mismatch');
        else console.log('PASS: Tag creator matched');
        await Tags.delete(tag.id);

        // Test Categories
        console.log('\n--- Testing Categories ---');
        const cat = await Categories.create('test-cat-' + Date.now(), 'desc', testUser);
        console.log('Category created. Creator:', cat.created_by);
        if (cat.created_by !== testUser) console.error('FAIL: Category creator mismatch');
        else console.log('PASS: Category creator matched');
        await Categories.delete(cat.id);

        // Test Departments
        console.log('\n--- Testing Departments ---');
        const dep = await Departments.create('test-dep-' + Date.now(), 'desc', testUser);
        console.log('Department created. Creator:', dep.created_by);
        if (dep.created_by !== testUser) console.error('FAIL: Department creator mismatch');
        else console.log('PASS: Department creator matched');
        await Departments.delete(dep.id);

        // Test Priorities
        console.log('\n--- Testing Priorities ---');
        const pri = await Priorities.create('test-pri-' + Date.now(), 1, '#000000', testUser);
        console.log('Priority created. Creator:', pri.created_by);
        if (pri.created_by !== testUser) console.error('FAIL: Priority creator mismatch');
        else console.log('PASS: Priority creator matched');
        await Priorities.delete(pri.id);

        console.log('\nAll verification steps completed.');
    } catch (e) {
        console.error('Verification failed:', e);
    } finally {
        pool.end();
    }
}

verify();
