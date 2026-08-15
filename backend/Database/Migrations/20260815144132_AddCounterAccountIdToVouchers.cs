using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Database.Migrations
{
    /// <inheritdoc />
    public partial class AddCounterAccountIdToVouchers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "CounterAccountId",
                table: "ReceiptVouchers",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "CounterAccountId",
                table: "PaymentVouchers",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_ReceiptVouchers_CounterAccountId",
                table: "ReceiptVouchers",
                column: "CounterAccountId");

            migrationBuilder.CreateIndex(
                name: "IX_PaymentVouchers_CounterAccountId",
                table: "PaymentVouchers",
                column: "CounterAccountId");

            migrationBuilder.AddForeignKey(
                name: "FK_PaymentVouchers_Accounts_CounterAccountId",
                table: "PaymentVouchers",
                column: "CounterAccountId",
                principalTable: "Accounts",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_ReceiptVouchers_Accounts_CounterAccountId",
                table: "ReceiptVouchers",
                column: "CounterAccountId",
                principalTable: "Accounts",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_PaymentVouchers_Accounts_CounterAccountId",
                table: "PaymentVouchers");

            migrationBuilder.DropForeignKey(
                name: "FK_ReceiptVouchers_Accounts_CounterAccountId",
                table: "ReceiptVouchers");

            migrationBuilder.DropIndex(
                name: "IX_ReceiptVouchers_CounterAccountId",
                table: "ReceiptVouchers");

            migrationBuilder.DropIndex(
                name: "IX_PaymentVouchers_CounterAccountId",
                table: "PaymentVouchers");

            migrationBuilder.DropColumn(
                name: "CounterAccountId",
                table: "ReceiptVouchers");

            migrationBuilder.DropColumn(
                name: "CounterAccountId",
                table: "PaymentVouchers");
        }
    }
}
