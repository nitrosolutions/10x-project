import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";

// Load test environment variables
dotenv.config({ path: path.resolve(process.cwd(), ".env.test") });

/**
 * Utility function to perform cleanup
 * Extracted to be reusable from both global teardown and individual test contexts
 */
export async function cleanupTestData() {
  console.log("\n=== Cleaning Test Data ===\n");

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const testUserId = process.env.E2E_USERNAME_ID;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("❌ Missing Supabase configuration in .env.test");
    console.error("   Required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY");
    return;
  }

  if (!testUserId) {
    console.warn("⚠️  No E2E_USERNAME_ID provided, skipping cleanup");
    return;
  }

  console.log(`Supabase URL: ${supabaseUrl}`);
  console.log(`Test User ID: ${testUserId}\n`);

  try {
    // Create Supabase client with service role key to bypass RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Count receipts before deletion
    const { count: beforeCount, error: countError } = await supabase
      .from("receipts")
      .select("*", { count: "exact", head: true })
      .eq("user_id", testUserId);

    if (countError) {
      console.error("❌ Error counting receipts:", countError.message);
      throw countError;
    }

    console.log(`Found ${beforeCount ?? 0} receipt(s) for test user`);

    if (beforeCount === 0) {
      console.log("✅ No test data to clean up\n");
      console.log("===========================================\n");
      return;
    }

    // Delete all receipts for the test user
    // Note: receipt_items will be cascade deleted due to ON DELETE CASCADE
    console.log("Deleting test receipts...");
    const { error: deleteError, count: deletedCount } = await supabase
      .from("receipts")
      .delete({ count: "exact" })
      .eq("user_id", testUserId);

    if (deleteError) {
      console.error("❌ Error deleting receipts:", deleteError.message);
      throw deleteError;
    }

    console.log(`✅ Deleted ${deletedCount ?? 0} receipt(s)`);
    console.log("✅ Associated receipt_items were cascade deleted\n");

    // Verify cleanup
    const { count: afterCount } = await supabase
      .from("receipts")
      .select("*", { count: "exact", head: true })
      .eq("user_id", testUserId);

    if (afterCount === 0) {
      console.log("✅ Cleanup verified - no receipts remaining");
    } else {
      console.warn(`⚠️  Warning: ${afterCount} receipt(s) still exist after cleanup`);
    }

    console.log("\n===========================================\n");
  } catch (error) {
    console.error("\n❌ Cleanup failed:", error);
    console.error("Test data may not have been cleaned up properly\n");
    // Don't throw - we don't want to fail the test run because of cleanup issues
  }
}

/**
 * Global teardown - called by Playwright after all tests complete
 */
async function globalTeardown() {
  console.log("\n=== Global Teardown: Cleaning Test Data ===");
  await cleanupTestData();
}

export default globalTeardown;
