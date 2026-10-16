using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Varde.Data.Migrations
{
    /// <inheritdoc />
    public partial class SidetmedordChatUrl : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 122,
                column: "ChatUrl",
                value: "https://mentalhelse.no/hjelpechat/");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 122,
                column: "ChatUrl",
                value: "https://sidetmedord.mentalhelse.no/");
        }
    }
}
